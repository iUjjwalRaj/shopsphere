export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    return res.status(400).json({
      message: formattedErrors[0]?.message || 'Validation failed',
      errors: formattedErrors,
    });
  }
  req.body = result.data;
  next();
};

export default validate;
