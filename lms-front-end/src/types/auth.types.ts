import { z } from "zod";

export const signinSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});


export const userDto = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    full_name: z.string(),
    roles: z.array(z.string()),
    csrfToken: z.string(),
})

export type SigninFormData = z.infer<typeof signinSchema>;
export type UserDto = z.infer<typeof userDto>;