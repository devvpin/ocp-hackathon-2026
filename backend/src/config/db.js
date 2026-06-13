let prisma;

try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });
} catch {
  // Prisma client not available — return a stub proxy so the server boots.
  // Any module that calls prisma.someModel.xxx will get a clear error message.
  console.warn(
    '[DB] Prisma client not available. Run `npm run generate` after defining schema models.'
  );
  prisma = new Proxy(
    {},
    {
      get(_, prop) {
        return new Proxy(
          {},
          {
            get() {
              return () => {
                throw new Error(
                  `[DB] Prisma client not available. Run 'npm run generate' first.`
                );
              };
            },
          }
        );
      },
    }
  );
}

module.exports = prisma;
