# Development image
FROM node:20.11-alpine3.19

WORKDIR /app

# Create non-root user and set up permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown nextjs:nodejs /app && \
    mkdir -p /home/nextjs/.npm && \
    chown -R nextjs:nodejs /home/nextjs

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Switch to non-root user
USER nextjs

# We'll mount the source code as a volume, so we only need the package files
COPY --chown=nextjs:nodejs package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development

EXPOSE 3000

# Use pnpm dev for development with hot reload
CMD ["pnpm", "dev"]