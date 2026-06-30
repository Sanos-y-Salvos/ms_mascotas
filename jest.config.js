module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // ¡Esta es la línea clave para que los comentarios de istanbul funcionen!
  coverageProvider: 'babel',
  // Excluye del reporte de cobertura los archivos que no contienen lógica de negocio relevante,
  // como las entidades de TypeORM, que son principalmente configuración.
  coveragePathIgnorePatterns: ['/node_modules/', '/src/entities/'],
  // Ahora que solo medimos la lógica de negocio, podemos exigir un 100% estricto.
  // Si la cobertura baja en cualquier archivo restante, el test fallará.
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};