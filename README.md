# yupgen

Schemas generation utils for [Yup](https://github.com/jquense/yup)

### How to use:

```bash
# install (npm/yarn) from npm registry
npm install yupgen

# init config
yupgen init

# run
yupgen
```

### Example config:

Config file name: yupgen.json:

```typescript
{
  schemas: Array<{
    name?: string,
    source: string,
    method?: string,
    body: string
  }>,
  options: {
    outDir?: string
  }
}
```

- default outDir if not specified will be on the root and schemas/ folder
- will detect if there's tsconfig.json file, and hence generate .ts output file with extra type definition.

```json
{
  "schemas": [
    {
      "name": "todo",
      "source": "https://jsonplaceholder.typicode.com/todos/1",
      "method": "GET"
    },
    {
      "name": "todos",
      "source": "https://jsonplaceholder.typicode.com/todos"
    }
  ],
  "options": {
    "outDir": "src/schemas"
  }
}
```

### Example output:

example on todo.js

```js
import { object, number, string, boolean } from "yup";

export const todo = object()
  .shape({
    userId: number().required(),
    id: number().required(),
    title: string().required(),
    completed: boolean().required()
  })
  .defined();
```
