# GCP deploy scripts

Three-environment setup for Gorumin. **Full guide:** [docs/infra/environments.md](../../docs/infra/environments.md)

| Environment | Env file | Deploy |
|-------------|----------|--------|
| Local | `apps/medusa/.env`, `apps/storefront/.env.local` | `pnpm dev` |
| Sandbox | `infra/gcp/.env.sandbox` | `./deploy-sandbox.sh` |
| Production | `infra/gcp/.env.production` | `./deploy-prod.sh` |

```bash
# First-time sandbox
./infra/gcp/init-sandbox-env.sh
./infra/gcp/bootstrap-sandbox.sh
./infra/gcp/deploy-sandbox.sh
./infra/gcp/remap-domains-sandbox.sh
```

Templates: `env.local.example`, `env.sandbox.example`, `env.production.example`
