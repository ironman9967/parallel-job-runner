
export const importApp = app => import(app).then(app => app.default)
