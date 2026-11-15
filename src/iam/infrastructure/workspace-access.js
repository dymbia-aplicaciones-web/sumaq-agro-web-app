const workspacePaths = [
    [/^\/field-management(?:\/|$)/, ['FARMER']],
    [/^\/profiles\/cooperative(?:\/|$)/, ['COOPERATIVE_DIRECTOR']],
    [/^\/profiles\/settings(?:\/|$)/, ['FARMER', 'AGRONOMIST']],
    [/^\/crop-health\/assigned-plots(?:\/|$)/, ['AGRONOMIST']],
    [/^\/harvest-certification(?:\/|$)/, ['FARMER', 'COOPERATIVE_DIRECTOR']]
];

export function canOpenWorkspace(role, path) {
    return workspacePaths.find(([pattern]) => pattern.test(path))?.[1].includes(role) ?? true;
}
