import React, { useState, useMemo } from 'react';
import {
    Button, Input, message, Tree, Layout, theme,
    Typography, Card, Space, Empty, Tooltip, Upload
} from 'antd';
import {
    FolderOpenOutlined,
    FileTextOutlined,
    CopyOutlined,
    ScissorOutlined,
    SearchOutlined,
    BlockOutlined,
    PlusOutlined,
    FileAddOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import { splitOpenAPI } from "./parser.ts";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const App: React.FC = () => {
    const { token: { borderRadiusLG, colorPrimary, colorBgLayout } } = theme.useToken();

    const [yamlText, setYamlText] = useState('');
    const [files, setFiles] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [searchValue, setSearchValue] = useState('');

    const handleFileUpload = (file: File) => {
        const isYaml = file.name.endsWith('.yaml') || file.name.endsWith('.yml') || file.type === 'application/x-yaml';
        if (!isYaml) {
            message.error(`${file.name} не является YAML файлом!`);
            return Upload.LIST_IGNORE;
        }
        if (file.size === 0) {
            message.error(`Файл ${file.name} пуст!`);
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content || !content.trim()) {
                message.error(`Содержимое файла ${file.name} пустое или состоит из пробелов!`);
                return;
            }
            setYamlText(content);
            message.success(`Файл ${file.name} загружен`);
        };
        reader.readAsText(file);
        return false;
    };

    const handleParse = () => {
        const result = splitOpenAPI(yamlText);
        if (result.error) {
            message.error(result.error);
            return;
        }
        setFiles(result.files);
        setSelectedFile('/openapi.yaml');
        message.success(`Разрезано на ${Object.keys(result.files).length} файлов`);
    }

    const downloadZip = async () => {
        const zip = new JSZip();

        Object.entries(files).forEach(([path, content]) => {
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            zip.file(cleanPath, content);
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        saveAs(blob, 'openapi_structure.zip');
        message.success('Архив успешно скачан!');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success('Скопировано в буфер!');
    };

    const treeData = useMemo(() => {
        const root: any[] = [];
        const lowerSearch = searchValue.toLowerCase();

        Object.keys(files).forEach((path) => {
            const parts = path.split('/').filter(Boolean);
            let current = root;

            parts.forEach((part, i) => {
                const isFile = i === parts.length - 1;
                const fullPath = '/' + parts.slice(0, i + 1).join('/');
                let node = current.find(n => n.titleStr === part);

                if (!node) {
                    node = {
                        titleStr: part,
                        key: fullPath,
                        isLeaf: isFile,
                        children: []
                    };
                    current.push(node);
                }
                current = node.children;
            });
        });

        const getNodes = (nodes: any[]): any[] => {
            return nodes
                .map(node => {
                    const children = getNodes(node.children);
                    const isMatch = node.titleStr.toLowerCase().includes(lowerSearch);

                    if (!isMatch && children.length === 0) return null;

                    const index = node.titleStr.toLowerCase().indexOf(lowerSearch);
                    const beforeStr = node.titleStr.substring(0, index);
                    const afterStr = node.titleStr.slice(index + lowerSearch.length);
                    const searchPart = node.titleStr.substring(index, index + lowerSearch.length);

                    const title = (
                        <span>
                            {node.isLeaf ?
                                <FileTextOutlined style={{ color: colorPrimary, marginRight: 6 }} /> :
                                <FolderOpenOutlined style={{ color: '#faad14', marginRight: 6 }} />
                            }
                            {index > -1 && lowerSearch ? (
                                <span>
                                    {beforeStr}
                                    <span style={{ backgroundColor: '#ffc069', borderRadius: 2 }}>{searchPart}</span>
                                    {afterStr}
                                </span>
                            ) : <span>{node.titleStr}</span>}
                        </span>
                    );

                    return { ...node, title, children };
                })
                .filter(Boolean) as any[];
        };

        return getNodes(root);
    }, [files, searchValue, colorPrimary]);

    return (
        <Layout style={{ minHeight: '97vh', background: colorBgLayout, padding: '24px' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                <header style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space size="middle">
                        <div style={{
                            background: colorPrimary,
                            padding: '8px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <BlockOutlined style={{ color: 'white', fontSize: 24 }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>OpenAPI Splitter</Title>

                        </div>
                    </Space>

                    <Space>
                        {Object.keys(files).length > 0 && (
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={downloadZip}
                            >
                                Скачать ZIP
                            </Button>
                        )}
                        <Button
                            type="primary"
                            size="large"
                            icon={<ScissorOutlined />}
                            onClick={handleParse}
                            disabled={!yamlText.trim()}
                            style={{ boxShadow: '0 4px 14px 0 rgba(24,144,255,0.39)' }}
                        >
                            Разрезать спецификацию
                        </Button>
                    </Space>
                </header>

                <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 140px)' }}>
                    <Card
                        title="Структура проекта"
                        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
                        style={{ width: 380, borderRadius: borderRadiusLG, overflow: 'hidden' }}
                    >
                        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                            <Input
                                placeholder="Поиск файлов..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                allowClear
                                onChange={e => setSearchValue(e.target.value)}
                                variant="filled"
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', padding: '12px 8px' }}>
                            {treeData.length > 0 ? (
                                <Tree
                                    treeData={treeData}
                                    showLine={{ showLeafIcon: false }}
                                    defaultExpandAll
                                    autoExpandParent
                                    onSelect={(keys) => keys[0] && setSelectedFile(keys[0] as string)}
                                    selectedKeys={[selectedFile]}
                                />
                            ) : (
                                <Empty description={searchValue ? "Ничего не найдено" : "Нет данных"} image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ marginTop: 40 }} />
                            )}
                        </div>
                    </Card>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <Card
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Входящий OpenAPI YAML</span>
                                    <Upload accept=".yaml,.yml" showUploadList={false} beforeUpload={handleFileUpload}>
                                        <Tooltip title="Загрузить файл">
                                            <Button type="primary" shape="circle" icon={<PlusOutlined />} size="small" />
                                        </Tooltip>
                                    </Upload>
                                </div>
                            }
                            size="small"
                            styles={{ body: { padding: 0 } }}
                            style={{ borderRadius: borderRadiusLG }}
                        >
                            <Dragger accept=".yaml,.yml" showUploadList={false} beforeUpload={handleFileUpload} style={{ border: 'none', background: 'transparent' }}>
                                <TextArea
                                    value={yamlText}
                                    onChange={e => setYamlText(e.target.value)}
                                    autoSize={{ minRows: 8, maxRows: 20 }}
                                    placeholder="Вставьте YAML или перетащите файл сюда..."
                                    style={{
                                        border: 'none',
                                        fontFamily: "'Fira Code', monospace",
                                        fontSize: '13px',
                                        padding: '12px',
                                        background: 'transparent',
                                        resize: 'vertical',
                                        minHeight: '160px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                { !yamlText && (
                                    <div style={{ padding: '0 0 12px 0', color: '#bfbfbf', pointerEvents: 'none' }}>
                                        <FileAddOutlined /> Перетащите файл в это поле
                                    </div>
                                )}
                            </Dragger>
                        </Card>

                        <Card
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong>{selectedFile || "Выберите файл"}</Text>
                                    {files[selectedFile] && (
                                        <Tooltip title="Скопировать содержимое">
                                            <Button type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(files[selectedFile])} />
                                        </Tooltip>
                                    )}
                                </div>
                            }
                            styles={{ body: { padding: 0, flex: 1, position: 'relative' } }}
                            style={{ flex: 1, borderRadius: borderRadiusLG, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto', padding: 16, background: '#f8f9fa', fontFamily: "'Fira Code', monospace", fontSize: '13px', color: '#272727' }}>
                                {files[selectedFile] ? (
                                    <pre style={{ margin: 0 }}>{files[selectedFile]}</pre>
                                ) : (
                                    <Empty description="Файл не выбран или пуст" style={{ marginTop: '10%' }} />
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default App;