# GCP deploy scripts

Three-environment setup for Gorumin. **Full guide:** [docs/infra/environments.md](../../docs/infra/environments.md)

| Environment | Env file | Deploy |
|-------------|----------|--------|
| Local | `apps/medusa/.env`, `apps/storefront/.env.local` | `pnpm dev` |
| Sandbox | `infra/gcp/.env.sandbox` | `./deploy-sandbox.sh` |
| Production | `infra/gcp/.env.production` | `./deploy-prod.sh` |

```bash
# First-time sandbox
cp env.sandbox.example .env.sandbox   # fill secrets
./bootstrap-sandbox.sh
./deploy-sandbox.sh
./remap-domains-sandbox.sh
```

Templates: `env.local.example`, `env.sandbox.example`, `env.production.example`
