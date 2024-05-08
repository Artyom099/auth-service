export const BAD_REQUEST_SCHEMA = {
  type: 'object',
  example: {
    hasError: true,
    error: {
      code: 'number',
      extensions: [
        {
          field: 'string',
          message: 'string',
        },
      ],
    },
  },
};
