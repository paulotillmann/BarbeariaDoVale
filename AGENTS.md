# Projeto: barbearia-cloned (React + Vite + Tailwind + Router)

Regras para trabalhar neste projeto. SIGA À RISCA.

## Estrutura (não invente outra)

- `src/pages/` — telas do app (Home.jsx e Sobre.jsx já existem). Uma tela = um arquivo.
- `src/components/` — componentes reutilizáveis (Botao, Card e Navbar são exemplos do padrão).
- `src/App.jsx` — declara as rotas. Mexa aqui SÓ para adicionar <Route> de página nova.
- `src/main.jsx`, `vite.config.js`, `eslint.config.js`, `index.html` — NÃO MEXER.

## Como criar um componente novo

1. Crie `src/components/NomeDoComponente.jsx`
2. Use `export default function NomeDoComponente({ props }) { ... }`
3. Estilize SÓ com classes Tailwind no className. NÃO crie arquivos .css.
4. Importe com caminho relativo: `import X from "../components/X.jsx"` (a extensão .jsx é obrigatória).

## Como adicionar uma página nova

1. Crie `src/pages/MinhaPagina.jsx` (copie o padrão de Sobre.jsx)
2. Em `src/App.jsx`: importe e adicione `<Route path="/minha-pagina" element={<MinhaPagina />} />`
3. Adicione o `<Link to="/minha-pagina">` na Navbar.
4. Navegação SEMPRE com `<Link>` do react-router-dom, NUNCA `<a href>`.

## Ícones

Importe de `lucide-react`: `import { House, Search, User } from "lucide-react"` e use `<House size={16} />`.

## Como rodar

Use a tool `servidor-dev`: acao='iniciar', comando='npm run dev', porta=5173.
NUNCA rode `npm run dev` pelo bash. O app abre em http://localhost:5173.

## Checagens (antes de dizer que terminou)

1. `npm run lint` pelo bash — corrija TODOS os erros que apontar.
2. `npm run build` pelo bash — se falhar, corrija o erro apontado.
- Novas dependências: `npm install <pacote>` pelo bash (isso pode, é comando que termina).
