# PostgreSQL

PostgreSQL 16 isolado em aurora-net. Sem porta exposta — outras stacks conectam por DNS interno do Swarm.

## Como usar

```bash
aurora deploy postgres
```

Sera perguntado:

- **POSTGRES_DB** — nome do banco inicial (default: `appdb`)
- **POSTGRES_USER** — usuario (default: `appuser`)
- **POSTGRES_PASSWORD** — senha (gerada automaticamente se vazia, 24 bytes base64url)

## Como outras stacks conectam

Dentro do aurora-net, o host eh `postgres` (nome do service) na porta `5432`:

```
DATABASE_URL=postgresql://appuser:SUA_SENHA@postgres:5432/appdb
```

Voce vai precisar dessa string quando deployar n8n, Chatwoot, Mautic, etc. A senha fica em `/opt/aurora/configs/postgres.env` no servidor (chmod 600).

## Backup manual

```bash
docker exec $(docker ps -q -f name=postgres_postgres) pg_dump -U appuser appdb > backup.sql
```

Backup automatizado vem na v0.2.

## Acessar via psql

```bash
docker exec -it $(docker ps -q -f name=postgres_postgres) psql -U appuser -d appdb
```

## Remocao

```bash
aurora remove postgres
```

**Preserva o volume `postgres-data`** com todos os dados. Pra wipe total:

```bash
docker volume rm postgres_postgres-data
```
