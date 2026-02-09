import yaml from 'js-yaml';

export function splitOpenAPI(yamlText: string): { files: Record<string, string>, error?: string } {
    let parsed;

    try {
        parsed = yaml.load(yamlText) as any;
        if (!parsed || typeof parsed !== 'object') {
            return {files: {}, error: "Неверный YAML"};
        }
    } catch (e) {
        return {files: {}, error: "Ошибка парсинга: " + (e as Error).message};
    }

    if (!parsed.openapi) {
        return {files: {}, error: "Не OpenApi спецификация"}
    }
    const files: Record<string, string> = {};

    const root: any = {
        openapi: parsed.openapi,
        info: parsed.info,
        servers: parsed.servers,
        tags: parsed.tags,
    }
    const rootKeys = ['openapi', 'info', 'servers', 'tags', 'security', 'x-tagGroups'];
    Object.keys(parsed).forEach(key => {
        if (!['components', 'paths'].includes(key) && !rootKeys.includes(key)) {
            root[key] = parsed[key];
        }
    })
    files['/openapi.yaml'] = yaml.dump(root, {indent: 2});

    if (parsed.components) {
        const components = parsed.components;
        if (components.schemas) {
            Object.entries(components.schemas).forEach(([name, schema]) => {
                const content = yaml.dump({[name]: schema}, {indent: 2});
                files[`/components/schemas/${name}.yaml`] = content;
            })
        }
        if (components.securitySchemes) {
            Object.entries(components.securitySchemes).forEach(([name, scheme]) => {
                const content = yaml.dump({[name]: scheme}, {indent: 2});
                files[`/components/securitySchemes/${name}.yaml`] = content;
            });
        }

        const otherTypes = ['responses', 'parameters', 'examples', 'requestBodies', 'headers'];
        otherTypes.forEach(type => {
            if (components[type]) {
                Object.entries(components[type] as Record<string, string>).forEach(([name, item]) => {
                    const content = yaml.dump({[name]: item}, {indent: 2});
                    files[`/components/${type}/${name}.yaml`] = content;
                })
            }
        })
    }
    if (parsed.paths) {
        Object.entries(parsed.paths).forEach(([path, methods]) => {
            const filePath = `/paths${path}.yaml`.replace(/\/+/g, '/');
            files[filePath] = yaml.dump({[path]: methods}, {indent: 2});
        });
    }

    return {files};

}