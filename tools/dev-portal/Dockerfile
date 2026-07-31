FROM node:20-alpine
WORKDIR /app
COPY . .

# Persisted health history + captured errors live here, backed by the named
# volume mca-portal-data. Owned by `node` in the image so a FRESH volume
# inherits that ownership — Docker seeds an empty named volume from the image
# path, ownership included. An ALREADY-POPULATED volume keeps its existing
# (root-owned) permissions, so redeploying over the old root container needs a
# one-time chown — see README.md.
RUN mkdir -p /app/data && chown -R node:node /app/data

EXPOSE 4321

# Drop root: the portal binds 4321 (unprivileged) and only ever writes to
# /app/data, so it has no reason to run as root inside the container.
USER node

CMD ["node", "server.mjs"]
