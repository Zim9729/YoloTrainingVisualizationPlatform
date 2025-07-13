function pathJoin(...parts) {
    const isWindows = navigator?.platform?.startsWith('Win'); // 这个声明已经弃用，后续考虑更换方案
    const separator = isWindows ? '\\' : '/';

    return parts
        .map((part, index) => {
            if (index === 0) return part.replace(/[\\/]+$/, '');
            return part.replace(/^[\\/]+|[\\/]+$/g, '');
        })
        .filter(Boolean)
        .join(separator);
}

function splitPath(filePath) {
    return filePath
        .replace(/\\/g, '/') 
        .split('/')
        .filter(Boolean);
}

export {
    pathJoin,
    splitPath
};