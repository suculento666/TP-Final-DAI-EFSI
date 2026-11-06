// Envuelve un handler async para que sus rechazos vayan al errorHandler.
// En Express 4 los errores de async no se capturan solos.
export const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
