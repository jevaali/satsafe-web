# vue-project

A Vue 3 + Vite task management application with authentication, categories, and priorities.

## Tech Stack

- **Vue 3** (Composition API)
- **Vite**
- **TypeScript**
- **Pinia** (state management)
- **Vue Router**

## Getting Started

```sh
npm install
```

### Development

```sh
npm run dev
```

### Build

```sh
npm run build
```

### Lint

```sh
npm run lint
```

## Project Structure

| Directory         | Description                             |
| ----------------- | --------------------------------------- |
| `src/api`         | Axios client and interceptors           |
| `src/components`  | Vue components (UI, task, layout, etc.) |
| `src/composables` | Reusable composition functions          |
| `src/domain`      | TypeScript interfaces                   |
| `src/router`      | Route definitions                       |
| `src/services`    | API services, data handling, utilities  |
| `src/stores`      | Pinia stores                            |
| `src/views`       | Page views                              |

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur).
