# yupgen

Types generation utils for [Yup](https://github.com/jquense/yup)

### How to use:

```bash
# install (npm/yarn)
npm install @heygema/yupgen

# add config
touch yupgen.json

# run
yupgen
```

### example config:

- default outDir if not specified will be on the root and schemas/ folder
- will detect if there's tsconfig.json file, and hence generate .ts output file with extra type definition.

```json
{
  "types": [
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

### example output:

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
