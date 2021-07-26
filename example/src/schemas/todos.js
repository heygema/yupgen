import { array, object, number, string, boolean } from "yup";

export const todos = array().of(
  object()
    .shape({
      userId: number().required(),
      id: number().required(),
      title: string().required(),
      completed: boolean().required(),
    })
    .defined()
);
