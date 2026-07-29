# DeviceDock Frontend

DeviceDock-এর frontend একটি **Next.js 14 App Router** application। এটি NestJS backend-এর REST API ব্যবহার করে product browsing, authentication, cart, profile এবং admin dashboard পরিচালনা করে।

এই document-এ frontend-এর application architecture এবং visual design architecture—দুটিই ব্যাখ্যা করা হয়েছে।

## ব্যবহৃত মূল প্রযুক্তি

| Technology      | কী কাজে ব্যবহার হয়েছে                                               |
| --------------- | ------------------------------------------------------------------- |
| Next.js 14      | App Router, layouts, dynamic routes, middleware এবং optimized image |
| React 18        | Component এবং local UI state                                        |
| TypeScript      | API response, domain model এবং component props type-safe রাখা       |
| Tailwind CSS    | Responsive layout এবং visual styling                                |
| TanStack Query  | Backend data fetch, cache, loading state এবং mutation               |
| NextAuth        | Credentials login, JWT session এবং access-token refresh             |
| React Hook Form | Login, registration এবং settings form                               |
| Zod             | Login ও registration form validation                                |
| Sonner          | Success/error toast notification                                    |
| Lucide React    | UI icons                                                            |

`package.json`-এ আরও কিছু UI/animation dependency আছে, কিন্তু বর্তমান application code-এ উপরের technology-গুলোই সরাসরি ব্যবহৃত হয়েছে।

## High-level architecture

```text
Browser
  │
  ├── Next.js App Router
  │     ├── Public pages
  │     ├── Protected account pages
  │     └── Admin pages
  │
  ├── Global Providers
  │     ├── NextAuth SessionProvider
  │     ├── TanStack QueryClientProvider
  │     ├── AuthProvider
  │     └── Sonner Toaster
  │
  ├── apiFetch()
  │     ├── API base URL
  │     ├── JSON/FormData handling
  │     ├── Bearer access token
  │     └── Standard error conversion
  │
  └── NestJS REST API
```

একটি সাধারণ authenticated request-এর flow:

```text
Page/Component
  → useAuth() থেকে accessToken
  → TanStack Query query/mutation
  → apiFetch()
  → NestJS API
  → response cache/update
  → UI render এবং প্রয়োজন হলে toast
```

## Folder structure

```text
frontend/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth route handler
│   ├── admin/                           # Admin routes ও nested layout
│   ├── products/[id]/                   # Dynamic product details route
│   ├── cart/                            # Protected cart page
│   ├── login/ এবং register/             # Authentication pages
│   ├── profile/ এবং settings/           # Account pages
│   ├── shop/                            # Product search/filter page
│   ├── globals.css                      # Global styles ও component utility
│   ├── layout.tsx                       # Root application shell
│   └── page.tsx                         # Home page
├── components/
│   ├── pages/                           # Interactive storefront/account views
│   ├── admin/                           # Admin shell, views ও product form
│   ├── account/                         # Account-specific views
│   └── ui/                              # Reusable buttons, fields, dialog ও states
├── lib/
│   ├── api.ts                           # Central API client
│   ├── auth.ts                          # NextAuth configuration
│   ├── demo-products.ts                 # Product fallback data
│   └── types.ts                         # Shared domain/API types
├── public/images/                       # Static image assets
├── types/next-auth.d.ts                 # NextAuth type augmentation
├── middleware.ts                        # Authentication ও role protection
└── tailwind.config.ts                   # Design tokens
```

## 1. Routing architecture

Next.js App Router-এর file-system routing ব্যবহার করা হয়েছে।

| Route                       | দায়িত্ব                                     | Access        |
| --------------------------- | ------------------------------------------- | ------------- |
| `/`                         | Hero, featured products এবং category entry  | Public        |
| `/shop`                     | Search, category filter এবং sorting         | Public        |
| `/products/[id]`            | Product details এবং add-to-cart             | Public        |
| `/about`                    | Brand story এবং product principles          | Public        |
| `/how-it-works`             | Current shopping journey এবং roadmap        | Public        |
| `/contact`                  | Product, account ও order support directory  | Public        |
| `/login`                    | Credentials login                           | Public        |
| `/register`                 | Account creation                            | Public        |
| `/cart`                     | Cart দেখা ও quantity পরিবর্তন               | Authenticated |
| `/profile`                  | Current user profile                        | Authenticated |
| `/settings`                 | Profile update                              | Authenticated |
| `/account/*`                | Address, order, wishlist ও security section | Authenticated |
| `/admin`                    | Admin overview                              | Admin         |
| `/admin/users`              | User list                                   | Admin         |
| `/admin/users/[id]`         | User block, unblock ও delete                | Admin         |
| `/admin/products`           | Product search, filter ও pagination         | Admin         |
| `/admin/products/new`       | Product create ও image upload               | Admin         |
| `/admin/products/[id]/edit` | Product edit ও image management             | Admin         |

`app/layout.tsx` provider composition করে। `SiteChrome` storefront route-এ navbar/footer দেখায় এবং admin route-এ সেগুলো বাদ দেয়:

```text
Providers
  └── SiteChrome
        ├── Storefront → Navbar + page + Footer
        └── Admin      → independent dashboard layout
```

`app/admin/layout.tsx` একটি nested server layout। এটি admin pages-এর জন্য আলাদা dashboard shell এবং `AdminNav` যোগ করে।

## 2. Server এবং Client Component strategy

সব `page.tsx` Server Component। Metadata এবং page composition সেখানে থাকে। Interactivity `components/pages`, `components/admin` ও অন্য reusable Client Component-এ রাখা হয়েছে, কারণ সেগুলো:

- TanStack Query hooks ব্যবহার করে;
- form, filter, dropdown বা quantity-এর local state রাখে;
- `useRouter`, `useSearchParams` বা `usePathname` ব্যবহার করে;
- authentication session এবং mutations ব্যবহার করে।

বিশেষ করে `admin/layout.tsx` server-side `getServerSession()` ব্যবহার করে page render হওয়ার আগেই admin access যাচাই করে। তারপর responsive `AdminShell` client component dashboard interactions পরিচালনা করে।

বর্তমান architecture মূলত **client-side data fetching** ব্যবহার করে। অর্থাৎ page browser-এ render হওয়ার পর TanStack Query backend থেকে data আনে।

## 3. Provider composition

`components/providers.tsx` সব global client provider এক জায়গায় compose করে:

```text
SessionProvider
  └── QueryClientProvider
        └── AuthProvider
              ├── Application
              └── Toaster
```

### SessionProvider

NextAuth session browser-এর components-এ উপলভ্য করে।

### QueryClientProvider

সমস্ত query এবং mutation-এর shared cache দেয়। Default configuration:

```ts
queries: {
  staleTime: 30_000,
  retry: 1,
}
```

অর্থাৎ fetched data ৩০ সেকেন্ড fresh থাকে এবং failed query একবার retry হয়।

### AuthProvider

NextAuth-এর low-level API-কে application-friendly interface-এ রূপান্তর করে:

```ts
const { user, accessToken, loading, login, register, logout, syncUser } =
  useAuth();
```

এর ফলে page/component-কে সরাসরি NextAuth implementation জানতে হয় না।

### Toaster

Mutation, login এবং form submission-এর success/error feedback top-center toast হিসেবে দেখায়।

## 4. Authentication architecture

Authentication-এ frontend NextAuth এবং NestJS backend একসঙ্গে কাজ করে।

### Login flow

```text
Login form
  → AuthProvider.login()
  → NextAuth CredentialsProvider
  → POST /auth/login
  → backend access token + refresh-token cookie
  → NextAuth JWT
  → frontend session
```

NextAuth session strategy:

```ts
session: {
  strategy: 'jwt',
  maxAge: 15 * 60,
}
```

Backend access token এবং user information NextAuth JWT-তে রাখা হয়। Client session-এ শুধু application-এর প্রয়োজনীয় `user` এবং `accessToken` expose করা হয়।

### Token refresh

Access token-এর local expiry ১৪ মিনিট ধরা হয়েছে। Expire হলে NextAuth JWT callback:

```text
POST /auth/refresh
  → refresh token cookie পাঠায়
  → নতুন access token নেয়
  → JWT এবং user update করে
```

Refresh ব্যর্থ হলে token-এর মধ্যে `RefreshAccessTokenError` রাখা হয়।

### Logout

Frontend `signOut()` করার সময় NextAuth event backend-এর `/auth/logout` endpoint call করে refresh token invalidate করার চেষ্টা করে।

### Registration

Registration দুই ধাপে হয়:

```text
POST /auth/register
  → account তৈরি
  → credentials দিয়ে signIn()
  → authenticated session তৈরি
```

## 5. Route protection এবং authorization

`middleware.ts` নিচের routes protect করে:

```text
/cart
/profile
/settings
/admin
```

Session token না থাকলে user-কে redirect করা হয়:

```text
/login?callbackUrl=<requested-route>
```

Login সফল হলে `callbackUrl` safe internal path হলে user আগের requested page-এ ফিরে যায়।

Admin route-এর জন্য দুই স্তরের protection আছে:

1. Middleware token-এর `user.role` পরীক্ষা করে।
2. `admin/layout.tsx` server-side session আবার পরীক্ষা করে।

Non-admin user `/admin` access করলে `/profile`-এ redirect হয়। Backend-এর authorization guard-ই security-এর final authority; frontend protection মূলত navigation ও user experience উন্নত করে।

## 6. API client architecture

সব backend request `lib/api.ts`-এর `apiFetch<T>()` দিয়ে করা হয়।

এটি centralভাবে:

- `NEXT_PUBLIC_API_URL` থেকে base URL নেয়;
- JSON body থাকলে `Content-Type: application/json` যোগ করে;
- `FormData` হলে browser-কে boundary তৈরি করতে দেয়;
- authenticated request-এ `Authorization: Bearer <token>` যোগ করে;
- cookie পাঠাতে `credentials: 'include'` ব্যবহার করে;
- backend-এর `{ success, message, data }` envelope থেকে `data` return করে;
- non-2xx response-কে status-সহ `ApiError`-এ রূপান্তর করে।

ব্যবহারের উদাহরণ:

```ts
apiFetch<Cart>(
  '/cart/items',
  {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  },
  accessToken,
);
```

`money()` helper সব BDT price একই format-এ দেখায়।

## 7. Server-state architecture

Backend data local React state-এ manually manage না করে TanStack Query ব্যবহার করা হয়েছে।

Query key-এর উদাহরণ:

```ts
['products', query][('product', productId)]['cart']['profile'][
  ('admin', 'users')
][('admin', 'user', userId)][('admin', 'products')];
```

Query key data-এর identity হিসেবে কাজ করে। একই key ব্যবহার করা components cached result reuse করতে পারে।

### Query

`useQuery()` product, cart, profile এবং admin data fetch করে। Token-নির্ভর query-তে:

```ts
enabled: Boolean(accessToken);
```

ব্যবহার করা হয়েছে, যাতে session তৈরি হওয়ার আগে unauthorized request না যায়।

### Mutation এবং cache synchronization

Cart add/update/remove বা admin action-এর জন্য `useMutation()` ব্যবহৃত হয়েছে।

উদাহরণ:

```text
Add to cart সফল
  → queryClient.setQueryData(['cart'], returnedCart)
  → cart cache সঙ্গে সঙ্গে update
```

User block/unblock সফল হলে:

```text
Selected user cache update
  + users list invalidate
  → প্রয়োজন হলে fresh list fetch
```

এতে full-page reload ছাড়াই UI backend state-এর সঙ্গে synchronized থাকে।

## 8. Form architecture

Login, registration এবং settings form-এ React Hook Form ব্যবহার করা হয়েছে।

Login ও registration:

```text
Input
  → React Hook Form
  → Zod schema validation
  → valid হলে submit
  → AuthProvider
  → success/error toast
```

Zod দিয়ে email format, password length, name এবং password confirmation validate করা হয়।

Settings form existing session user দিয়ে `reset()` হয়। Update সফল হলে `syncUser()` NextAuth session-এর user data update করে, ফলে navbar এবং account UI-ও নতুন data দেখায়।

## 9. UI component architecture

Components তিন ধরনের দায়িত্বে ভাগ করা:

### Global components

- `Navbar`: public navigation, account menu এবং responsive mobile menu
- `Footer`: global footer
- `Providers`: application-wide contexts

### Reusable domain components

- `ProductCard`: product preview, image fallback, price এবং cart action
- `AddToCartButton`: authentication check, cart mutation এবং cache update
- `AdminNav`: current route অনুযায়ী active admin navigation

### Layout/shell components

- `AuthShell`: login/register-এর common split-screen layout
- `AccountShell`: profile/settings-এর common sidebar layout

Shell component pattern repeated markup কমায় এবং related pages-এর design consistent রাখে।

## 10. Visual design architecture

Frontend একটি warm editorial e-commerce design অনুসরণ করে।

### Design tokens

`tailwind.config.ts`-এ semantic color token আছে:

| Token         | Value         | ব্যবহার                            |
| ------------- | ------------- | ---------------------------------- |
| `ink`         | `#0a0a0b`     | Primary text, dark surface, button |
| `paper`       | `#f7f7f8`     | Main page background               |
| `accent`      | `#b4472f`     | CTA, highlight এবং focus           |
| `sage`        | `#667085`     | Supporting neutral tone            |
| `shadow-soft` | Custom shadow | Cards ও elevated panels            |

Semantic token ব্যবহারের ফলে raw color সব জায়গায় repeat না করে design centrally পরিবর্তন করা যায়।

### Typography

Body, UI এবং heading-এ self-hosted Poppins ব্যবহার করা হয়েছে। `.display` utility heavier weight ও tight letter-spacing দেয়, কিন্তু editorial serif styling ব্যবহার করে না।

Storefront visual hierarchy conversion-focused:

- product-first hero এবং direct shopping CTA;
- compact section spacing ও dense product discovery;
- modern sans-serif typography;
- neutral surfaces, burnt-orange/maroon accent এবং controlled gradients;
- category, offer, list, spotlight ও product-grid-এর আলাদা presentation।

### Shape এবং surface language

Design-এ নিয়মিত ব্যবহার হয়েছে:

- pill-shaped CTA button;
- `rounded-2xl` থেকে বড় `rounded-[2rem]` card;
- clean neutral background;
- dark `ink` panel;
- subtle border ও translucent white surface;
- controlled gradient, glass surface এবং soft shadow।

### Responsive strategy

Tailwind-এর mobile-first breakpoint ব্যবহার করা হয়েছে:

```text
Default/mobile → single column
sm             → compact two-column sections
md             → desktop navigation
lg             → product grids, sidebars ও split layouts
xl             → admin metric grid
```

উদাহরণ:

- Navbar desktop-এ horizontal, mobile-এ toggle menu।
- Product grid mobile-এ ১, `sm`-এ ২ এবং `lg`-এ ৪ column।
- Cart desktop-এ content + sticky summary sidebar।
- Admin desktop-এ sidebar + content layout।
- Authentication desktop-এ split screen, mobile-এ শুধু form panel।

### Loading, empty এবং error experience

UI state অনুযায়ী আলাদা feedback আছে:

- Product list ও details-এ skeleton/pulse loading;
- cart/admin request-এ spinner;
- empty shop/cart-এর জন্য dedicated message এবং CTA;
- mutation error-এর জন্য toast;
- product API fail করলে home, shop এবং product details-এ demo product fallback।

Demo fallback storefront preview সচল রাখে, তবে production environment-এ API error এবং empty data আলাদা করে দেখানো অধিক উপযোগী হতে পারে।

## 11. Shop এবং cart flow

Shop page-এর filter state:

```text
search + category + sort
  → URLSearchParams
  → query string
  → TanStack Query key
  → GET /products
```

Category initial value URL-এর `category` query parameter থেকে আসে। তাই homepage/navbar-এর category link shop-কে pre-filter করতে পারে।

Add-to-cart flow:

```text
Button click
  ├── user নেই → toast + /login
  └── user আছে
        → POST /cart/items
        → returned cart cache-এ set
        → success toast
```

Cart page quantity update এবং remove—দুই operation-এর জন্য একই mutation ব্যবহার করে। Backend প্রতিবার updated cart return করায় `['cart']` cache সরাসরি replace করা হয়।

## 12. Admin architecture

Admin section full-page independent dashboard shell ব্যবহার করে। এতে fixed desktop sidebar, top header, mobile drawer এবং logout confirmation আছে; storefront navbar/footer admin route-এ render হয় না।

Admin overview:

- users ও products parallel query করে;
- total customer/product count দেখায়;
- featured product count client-side calculate করে;
- `price × quantity` দিয়ে current inventory value calculate করে;
- low-stock products visually highlight করে।

User details page mutation দিয়ে account block/unblock এবং delete করে। Admin user-এর destructive actions UI-তে disabled রাখা হয়েছে।

Product management real backend CRUD ব্যবহার করে:

- search, category filter, sorting এবং pagination;
- create/edit form validation;
- multipart image upload, preview এবং image remove;
- stock, category ও featured status badge;
- delete confirmation এবং query-cache synchronization।

Orders, inventory history, categories, brands, reviews, coupons, notifications এবং settings-এর dashboard routes প্রস্তুত আছে। সংশ্লিষ্ট backend API না থাকায় এগুলো fake records না দেখিয়ে required contract পরিষ্কার করে।

## 13. Type architecture

`lib/types.ts` frontend-এর shared domain contract রাখে:

```text
Product
ProductImage
User
Cart
AuthResult
PaginatedProducts
PaginatedUsers
ApiEnvelope<T>
```

`ApiEnvelope<T>` generic হওয়ায় একই API response shape বিভিন্ন data type-এর সঙ্গে reuse করা যায়।

`types/next-auth.d.ts` NextAuth-এর default Session, User এবং JWT type extend করে backend user, access token, refresh token ও expiry type-safe রাখে।

## 14. Image architecture

Local static asset `public/images` থেকে serve হয়। Product image-এর জন্য Next.js `Image` component ব্যবহার করা হয়েছে।

`next.config.mjs` শুধু Cloudinary image host allow করে:

```ts
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
  },
];
```

Product image না থাকলে component category-based gradient এবং CSS device placeholder দেখায়।

## 15. Environment variables

`.env.example` copy করে `.env.local` তৈরি করা যায়:

```bash
cp .env.example .env.local
```

| Variable              | উদ্দেশ্য                                    |
| --------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Browser থেকে accessible NestJS API URL      |
| `API_INTERNAL_URL`    | Next.js server থেকে backend-এর internal URL |
| `NEXTAUTH_URL`        | NextAuth application URL                    |
| `NEXTAUTH_SECRET`     | NextAuth JWT/session signing secret         |

Local default:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
API_INTERNAL_URL=http://localhost:8080/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace_with_a_long_random_secret
```

Docker Compose-এ `API_INTERNAL_URL` সাধারণত Docker network-এর backend hostname ব্যবহার করে, কিন্তু `NEXT_PUBLIC_API_URL` browser-এর জন্য host-accessible URL থাকে।

## 16. Local development

প্রথমে NestJS backend এবং তার dependencies চালু থাকতে হবে। তারপর:

```bash
pnpm install
pnpm dev
```

Frontend:

```text
http://localhost:3000
```

Production verification:

```bash
pnpm build
```

Production server:

```bash
pnpm start
```

## 17. Docker architecture

Frontend Dockerfile multi-stage build ব্যবহার করে:

```text
base
  → dependencies
      → build
          → minimal runtime
```

- dependency install-এ frozen lockfile এবং BuildKit cache ব্যবহার হয়;
- Next.js `output: 'standalone'` minimal runtime artifact তৈরি করে;
- final container non-root `node` user হিসেবে চলে;
- `dumb-init` process signal handle করে;
- HTTP health check homepage verify করে।

এই separation final image ছোট রাখে এবং build tools production runtime-এ বহন করতে হয় না।
