import { object, number, string, boolean } from "yup"

export const todo = object()
  .shape({
    userId: number().required(),
    id: number().required(),
    title: string().required(),
    completed: boolean().required(),
  })
  .defined()
