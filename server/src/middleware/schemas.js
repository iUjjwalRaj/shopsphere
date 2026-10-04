import { z } from 'zod';

const CATEGORIES = ['electronics', 'fashion', 'home', 'books', 'sports', 'beauty'];

export const registerSchema = z
  .object({
    name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required'),
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email format'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
  })
  .passthrough();

export const loginSchema = z
  .object({
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  })
  .passthrough();

export const productSchema = z
  .object({
    name: z.string({ required_error: 'Product name is required' }).trim().min(1, 'Product name is required'),
    description: z
      .string({ required_error: 'Product description is required' })
      .trim()
      .min(1, 'Product description is required'),
    price: z
      .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
      .min(0, 'Price cannot be negative'),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: 'Invalid category' }),
    }),
    brand: z.string().optional(),
    image: z.string().optional(),
    stock: z
      .number({ invalid_type_error: 'Stock must be a number' })
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .optional()
      .default(0),
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .min(0, 'Rating cannot be negative')
      .max(5, 'Rating cannot exceed 5')
      .optional()
      .default(0),
  })
  .passthrough();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, 'Product name cannot be empty').optional(),
    description: z.string().trim().min(1, 'Product description cannot be empty').optional(),
    price: z
      .number({ invalid_type_error: 'Price must be a number' })
      .min(0, 'Price cannot be negative')
      .optional(),
    category: z
      .enum(CATEGORIES, {
        errorMap: () => ({ message: 'Invalid category' }),
      })
      .optional(),
    brand: z.string().optional(),
    image: z.string().optional(),
    stock: z
      .number({ invalid_type_error: 'Stock must be a number' })
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .optional(),
    rating: z
      .number({ invalid_type_error: 'Rating must be a number' })
      .min(0, 'Rating cannot be negative')
      .max(5, 'Rating cannot exceed 5')
      .optional(),
  })
  .passthrough()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const orderItemSchema = z
  .object({
    product: z
      .string({ required_error: 'Product ID is required' })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    name: z.string().optional(),
    price: z.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price cannot be negative').optional(),
    quantity: z
      .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
      .int('Quantity must be an integer')
      .min(1, 'Quantity must be at least 1'),
  })
  .passthrough();

export const orderSchema = z
  .object({
    items: z
      .array(orderItemSchema, { required_error: 'Order items are required' })
      .min(1, 'Order must contain at least one item'),
    shippingAddress: z.object(
      {
        line1: z.string({ required_error: 'Address line is required' }).trim().min(1, 'Address line is required'),
        city: z.string({ required_error: 'City is required' }).trim().min(1, 'City is required'),
        state: z.string({ required_error: 'State is required' }).trim().min(1, 'State is required'),
        pincode: z.string({ required_error: 'Pincode is required' }).trim().min(1, 'Pincode is required'),
      },
      { required_error: 'Shipping address is required' }
    ),
    paymentMethod: z
      .enum(['COD', 'ONLINE'], {
        errorMap: () => ({ message: 'Invalid payment method' }),
      })
      .optional()
      .default('COD'),
  })
  .passthrough();
