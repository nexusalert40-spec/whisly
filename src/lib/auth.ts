import { z } from "zod";
import { lovable } from "@/integrations/lovable";
import { isCountryCode } from "./countries";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long")
  .regex(/[A-Za-z]/, "Include a letter")
  .regex(/[0-9]/, "Include a number");

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: passwordSchema,
    confirm: z.string(),
    country: z.string().refine(isCountryCode, "Choose your country"),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(1, "Enter your password").max(72),
});

export async function signInWithGoogle() {
  return lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
}
