# Backend — Calma Mente (NestJS + Prisma)

Guia de instalação e execução do backend em ambiente local (Windows). O projeto é um servidor NestJS com Prisma (PostgreSQL).

## Requisitos

- Node.js 18.x ou superior (recomendado LTS)
- npm (ou yarn/pnpm, este guia usa npm)
- PostgreSQL 14+ (local ou via Docker)
- Git (opcional)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do backend (`TCC-BeckEnd-main/.env`) com, no mínimo:

```
# Banco de dados (PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/calmamente?schema=public"

# Autenticação JWT
JWT_SECRET="uma-chave-secreta-forte"

# Porta do servidor (opcional; padrão 3000)
# PORT=3000

# URL do app frontend (usada em links de recuperação de senha)
# Em produção, ajuste para a URL real do front
APP_URL="http://localhost:4200"

# Envio de e-mail (opcional para desenvolvimento)
# Integração com Brevo (Sendinblue). Se não definir, o serviço faz log silencioso do token.
# BREVO_API_KEY="sua-chave-brevo"
# SMTP_FROM="Calma Mente <no-reply@exemplo.com>"
```

Notas:
- `DATABASE_URL` deve apontar para um PostgreSQL acessível. Altere usuário, senha, host, porta e nome do banco conforme seu ambiente.
- Se você não configurar `BREVO_API_KEY`, os e-mails de recuperação não serão enviados de fato, mas o fluxo local continuará funcionando.

## Banco de dados

### PostgreSQL local — Windows

1) Instale o PostgreSQL (versão 14+). No instalador, anote:
	- Usuário: `postgres`
	- Senha que você definiu
	- Porta (padrão `5432`)

2) Crie o banco de dados `calmamente` (via pgAdmin ou psql). Exemplo com psql:

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE calmamente;"
```

3) Ajuste a `DATABASE_URL` no `.env` para refletir usuário/senha/porta que você escolheu. Exemplo:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/calmamente?schema=public"
```

4) Gere o client Prisma e rode as migrations:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

Depois que o banco estiver acessível, gere o cliente Prisma e aplique o schema/migrations:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

Se estiver rodando em produção, o comando usado é:

```powershell
npx prisma migrate deploy
```

Opcional: para inspecionar os dados via interface web do Prisma Studio:

```powershell
npx prisma studio
```

## Instalação e execução local (desenvolvimento)

1) Instale as dependências:

```powershell
npm install
```

2) Gere o client do Prisma (se ainda não gerou) e aplique as migrations:

```powershell
npx prisma generate
npx prisma migrate dev --name init
```

3) Inicie o servidor em modo watch:

```powershell
npm run start:dev
```

O servidor inicia por padrão em `http://localhost:3000` (CORS habilitado). Os arquivos estáticos da pasta `uploads/` são servidos em `http://localhost:3000/uploads`.

Se precisar mudar a porta, defina `PORT` no `.env` (ex.: `PORT=4000`).

## Execução “production-like” local

```powershell
npm run build
npx prisma migrate deploy
npm run start:prod
```

 

## Arquitetura de pastas

Estrutura principal do projeto (simplificada):

```
TCC-BeckEnd-main/
	nest-cli.json               # Configuração do Nest CLI
	package.json                # Scripts e dependências
	tsconfig.json               # Configuração TypeScript
	tsconfig.build.json         # Config TS para build
	dockerfile                  # Dockerfile (para uso futuro/produção, opcional)
	README.md                   # Este guia
	.env.example                # Exemplo de variáveis de ambiente

	prisma/                     # Infraestrutura do Prisma (ORM)
		schema.prisma             # Modelo de dados e datasource (PostgreSQL)
		prisma.module.ts          # Módulo global do Prisma para Nest
		prisma.service.ts         # PrismaService (conexão/vida útil)
		migrations/               # Migrations geradas pelo Prisma
		manual/                   # Scripts SQL manuais (quando necessário)

	uploads/                    # Arquivos públicos (servidos em /uploads)
		avatars/                  # Avatares de usuários

	src/                        # Código-fonte do NestJS
		main.ts                   # Bootstrap da aplicação, CORS, static /uploads
		app.module.ts             # Módulo raiz (ConfigModule, etc.)
		app.controller.ts
		app.service.ts

		auth/                     # Autenticação e autorização
			auth.module.ts
			auth.controller.ts
			auth.service.ts
			jwt.strategy.ts
			JwtAuthGuard.ts
			roles.decorator.ts
			roles.guard.ts
			unique-email.validator.ts

		user/                     # Usuários (CRUD, busca por e-mail, etc.)
		company/                  # Empresas e relacionamento com usuários
		department/               # Departamentos e vínculos
		notification/             # Notificações do usuário
		question/                 # Perguntas (pulso/clima)
		search/                   # Pesquisas (survey)
		Dashboard/                # Painéis e agregações
		mail/                     # Serviço de e-mail (Brevo) p/ reset de senha
		DiaryEntry/               # Seeds e legado de diário (atual desativado)
		prisma/                   # (se houver utilidades adicionais p/ Prisma no src)
```

Pontos úteis:
- API NestJS vive em `src/` organizada por módulos de domínio (auth, user, company, etc.).
- Prisma centraliza o esquema em `prisma/schema.prisma`; migrations ficam em `prisma/migrations/`.
- Arquivos públicos ficam em `uploads/` e são servidos via `GET /uploads/*`.
- Configurações via `.env` (ex.: `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `PORT`).
- Porta padrão: `3000` (pode mudar com `PORT`). CORS está habilitado por padrão.

## Integração com o Front-end

- O backend expõe a API em `http://localhost:3000` por padrão.
- Ajuste a URL de API no front-end para apontar para seu backend local ao desenvolver.
- Para links de recuperação de senha enviados por e-mail, defina `APP_URL` para a URL do seu front (ex.: `http://localhost:4200`).

## Solução de problemas

- Erro Prisma P1001 (não consegue conectar): verifique `DATABASE_URL`, credenciais, host/porta do PostgreSQL e firewall.
- JWT inválido/ausente: defina `JWT_SECRET` no `.env`.
- E-mail não chega: sem `BREVO_API_KEY`, o serviço faz log silencioso; para enviar de verdade, configure `BREVO_API_KEY` e `SMTP_FROM`.
- Porta ocupada: defina `PORT` para outra porta disponível.

## Scripts npm disponíveis

- `npm run start:dev` — inicia em modo desenvolvimento (watch)
- `npm run start` — inicia sem watch
- `npm run start:prod` — inicia buildado (use após `npm run build` e migrations)
- `npm run build` — compila para `dist/`
- `npm run test` — executa testes (se houver)
- `npm run lint` — lint dos arquivos

---

