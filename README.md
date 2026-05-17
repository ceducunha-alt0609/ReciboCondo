# ReciboCondo – pacote para GitHub Pages

## Como subir
1. Crie um repositório no GitHub, por exemplo: `ReciboCondo`.
2. Envie todos os arquivos desta pasta para a raiz do repositório.
3. Em **Settings > Pages**, selecione a branch `main` e a pasta `/root`.
4. Acesse a URL gerada pelo GitHub Pages.

## Arquivos principais
- `index.html`: app principal.
- `manifest.json`: configuração PWA.
- `sw.js`: Service Worker para cache/offline.
- `assets/icons/`: ícones em vários tamanhos.
- `assets/splash/`: artes de splash.
- `assets/data/excel_legacy_import.json`: base legada convertida para importação.
- `backups/`: cópia da versão HTML validada.

## Login inicial
- Administrador: `123456`
- Visualizador: `123456`

## Observações
- O app usa IndexedDB/localStorage: os dados ficam no navegador do usuário.
- Use o backup JSON dentro do app com frequência.
- O primeiro carregamento precisa de internet para buscar bibliotecas CDN; depois o Service Worker tenta manter o cache para uso offline.
