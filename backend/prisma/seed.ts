import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ProductCategory, ProductStatus } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to seed products');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const MOBILE = ProductCategory.MOBILE;
const ACTIVE = ProductStatus.ACTIVE;

const products = [
  {
    title: 'Samsung Galaxy S25 Ultra',
    sku: 'MOB-SAM-S25U-256',
    slug: 'samsung-galaxy-s25-ultra',
    brand: 'Samsung',
    category: MOBILE,
    shortDescription: 'Flagship Android smartphone with AI features.',
    description:
      'Samsung Galaxy S25 Ultra featuring Snapdragon chipset, 256GB storage, 12GB RAM, 200MP camera and 6.9-inch Dynamic AMOLED display.',
    price: 159999,
    compareAtPrice: 169999,
    quantity: 20,
    status: ACTIVE,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    specifications: {
      Display: '6.9-inch Dynamic AMOLED 2X',
      Processor: 'Snapdragon 8 Elite',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '5000 mAh',
      Camera: '200 MP',
    },
  },
  {
    title: 'Apple iPhone 17 Pro',
    sku: 'MOB-APL-IP17P-256',
    slug: 'apple-iphone-17-pro',
    brand: 'Apple',
    category: MOBILE,
    shortDescription: 'Premium iPhone with Pro camera system.',
    description:
      'Apple iPhone 17 Pro with A19 Pro chip, 256GB storage and advanced camera capabilities.',
    price: 199999,
    compareAtPrice: 214999,
    quantity: 15,
    status: ACTIVE,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    specifications: {
      Display: '6.3-inch Super Retina XDR',
      Processor: 'A19 Pro',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '4200 mAh',
      Camera: '48 MP Triple Camera',
    },
  },
  {
    title: 'Google Pixel 10 Pro',
    sku: 'MOB-GGL-PX10P-256',
    slug: 'google-pixel-10-pro',
    brand: 'Google',
    category: MOBILE,
    shortDescription: 'AI-powered Pixel flagship smartphone.',
    description:
      'Google Pixel 10 Pro with Tensor G5 processor, 256GB storage and exceptional camera performance.',
    price: 149999,
    compareAtPrice: 159999,
    quantity: 18,
    status: ACTIVE,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    specifications: {
      Display: '6.8-inch OLED',
      Processor: 'Google Tensor G5',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '5100 mAh',
      Camera: '50 MP Triple Camera',
    },
  },
  {
    title: 'OnePlus 14',
    sku: 'MOB-ONE-14-256',
    slug: 'oneplus-14',
    brand: 'OnePlus',
    category: MOBILE,
    shortDescription: 'Fast and smooth flagship experience.',
    description:
      'OnePlus 14 with Snapdragon processor, AMOLED display and 100W fast charging.',
    price: 99999,
    compareAtPrice: 109999,
    quantity: 30,
    status: ACTIVE,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    specifications: {
      Display: '6.82-inch AMOLED',
      Processor: 'Snapdragon 8 Elite',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '5500 mAh',
      Charging: '100W',
    },
  },
  {
    title: 'Xiaomi 16 Pro',
    sku: 'MOB-XIA-16P-512',
    slug: 'xiaomi-16-pro',
    brand: 'Xiaomi',
    category: MOBILE,
    shortDescription: 'High-end smartphone with Leica camera.',
    description:
      'Xiaomi 16 Pro featuring Leica optics, Snapdragon processor and 512GB storage.',
    price: 114999,
    compareAtPrice: 124999,
    quantity: 25,
    status: ACTIVE,
    isFeatured: false,
    isTrending: true,
    isBestSeller: true,
    specifications: {
      Display: '6.73-inch AMOLED',
      Processor: 'Snapdragon 8 Elite',
      RAM: '16 GB',
      Storage: '512 GB',
      Battery: '5400 mAh',
      Camera: '50 MP Leica',
    },
  },
  {
    title: 'Nothing Phone 4',
    sku: 'MOB-NTG-PH4-256',
    slug: 'nothing-phone-4',
    brand: 'Nothing',
    category: MOBILE,
    shortDescription: 'Unique transparent design with Glyph interface.',
    description:
      'Nothing Phone 4 delivers clean Android experience and signature Glyph lighting.',
    price: 79999,
    compareAtPrice: 85999,
    quantity: 40,
    status: ACTIVE,
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    specifications: {
      Display: '6.7-inch OLED',
      Processor: 'Snapdragon 8s Gen 4',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '5000 mAh',
    },
  },
  {
    title: 'Realme GT 8 Pro',
    sku: 'MOB-RLM-GT8P-256',
    slug: 'realme-gt-8-pro',
    brand: 'Realme',
    category: MOBILE,
    shortDescription: 'Performance-focused gaming smartphone.',
    description:
      'Realme GT 8 Pro with flagship chipset and ultra-fast charging.',
    price: 69999,
    compareAtPrice: 74999,
    quantity: 35,
    status: ACTIVE,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    specifications: {
      Display: '6.78-inch AMOLED',
      Processor: 'Snapdragon 8 Gen 4',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '6000 mAh',
    },
  },
  {
    title: 'Vivo X300 Pro',
    sku: 'MOB-VIV-X300P-512',
    slug: 'vivo-x300-pro',
    brand: 'Vivo',
    category: MOBILE,
    shortDescription: 'Professional photography smartphone.',
    description:
      'Vivo X300 Pro featuring ZEISS optics, flagship chipset and premium display.',
    price: 119999,
    compareAtPrice: 129999,
    quantity: 22,
    status: ACTIVE,
    isFeatured: true,
    isTrending: false,
    isBestSeller: false,
    specifications: {
      Display: '6.8-inch AMOLED',
      Processor: 'Dimensity 9500',
      RAM: '16 GB',
      Storage: '512 GB',
      Camera: 'ZEISS Triple Camera',
    },
  },
  {
    title: 'Oppo Find X9 Pro',
    sku: 'MOB-OPP-FX9P-512',
    slug: 'oppo-find-x9-pro',
    brand: 'Oppo',
    category: MOBILE,
    shortDescription: 'Premium flagship with Hasselblad camera.',
    description:
      'Oppo Find X9 Pro featuring flagship performance and advanced photography.',
    price: 129999,
    compareAtPrice: 139999,
    quantity: 17,
    status: ACTIVE,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    specifications: {
      Display: '6.82-inch AMOLED',
      Processor: 'Snapdragon 8 Elite',
      RAM: '16 GB',
      Storage: '512 GB',
      Battery: '5600 mAh',
    },
  },
  {
    title: 'Motorola Edge 70 Ultra',
    sku: 'MOB-MOT-E70U-256',
    slug: 'motorola-edge-70-ultra',
    brand: 'Motorola',
    category: MOBILE,
    shortDescription: 'Premium Android smartphone with clean UI.',
    description:
      'Motorola Edge 70 Ultra featuring Snapdragon chipset, OLED display and premium design.',
    price: 89999,
    compareAtPrice: 96999,
    quantity: 28,
    status: ACTIVE,
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    specifications: {
      Display: '6.7-inch OLED',
      Processor: 'Snapdragon 8 Gen 4',
      RAM: '12 GB',
      Storage: '256 GB',
      Battery: '5000 mAh',
    },
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
