# Sanal Ajandam V2

Supabase destekli, Sci-Fi temalı, PWA uyumlu tek kullanıcılı ajanda uygulaması.

![Sanal Ajandam V2](https://via.placeholder.com/800x400/0f172a/6366f1?text=Sanal+Ajandam+V2)

## 🚀 Özellikler

- **Supabase Backend**: Veriler bulutta güvenle saklanır, cihazlar arası (PC/Mobil) anında senkronize olur.
- **Tek Kullanıcı Modu**: Sadece belirlenen e-posta/şifre ile giriş yapılabilir.
- **Futuristik Tasarım**: Uzay teknolojisi hissiyatı, glassmorphism paneller, neon accent renkler.
- **PWA Desteği**: Masaüstü ve telefona uygulama olarak yüklenebilir.
- **Çoklu Takvim**: Günlük, Haftalık, Aylık, Yıllık görünümler.

## 🛠 Kurulum ve Başlangıç

Bu proje Supabase gerektirir. Lütfen aşağıdaki adımları sırasıyla uygulayın.

### 1. Supabase Projesi Oluşturma

1.  [supabase.com](https://supabase.com/) adresine gidip giriş yapın ve yeni bir proje oluşturun.
2.  Project Settings > API kısmından `URL` ve `anon` public key değerlerini kopyalayın.
3.  Proje ana dizininde `.env` (veya `.env.local`) dosyası oluşturun ve bu değerleri yapıştırın:

    ```env
    VITE_SUPABASE_URL=https://your-project-url.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```
4.  Bağımlılıkları yükleyin:

    ```bash
    npm install
    ```

### 2. Tabloları Oluşturma (SQL Editor)

Supabase panelinde **SQL Editor**'ü açın ve aşağıdaki komutlari çalıştırın:

```sql
-- 1. Tasks Tablosu
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  category text,
  status text check (status in ('pending', 'in_progress', 'done', 'cancelled')),
  priority smallint,
  color text,
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Categories Tablosu (Özel listeler için)
create table public.categories (
  id text primary key, -- 'custom_...'
  user_id uuid references auth.users not null,
  name text not null,
  icon text,
  color text,
  is_default boolean default false,
  "order" integer default 0
);

-- 3. Row Level Security (RLS) Açma
alter table public.tasks enable row level security;
alter table public.categories enable row level security;

-- 4. RLS Politikaları (Sadece kendi verisini görsün)
create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

create policy "Users can view own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories for delete using (auth.uid() = user_id);
```

### 3. Kullanıcı Oluşturma & Ayarlar

1.  **Authentication > Settings** kısmına gidin.
    *   **Disable Signups**: Başkalarının kayıt olmasını engellemek için kapatın.
2.  **Authentication > Users** kısmından **Invite User** diyerek kendi e-postanızı ekleyin (veya "Add User" ile manuel ekleyin ve şifre belirleyin).
3.  Uygulamayı başlatın:

    ```bash
    npm run dev
    ```
4.  Belirlediğiniz e-posta ve şifre ile giriş yapın.

## 📱 Vercel Deploy

Projeyi Vercel'e deploy ederken **Settings > Environment Variables** kısmına şunları eklemeyi unutmayın:

*   `VITE_SUPABASE_URL`
*   `VITE_SUPABASE_ANON_KEY`

## 📂 Proje Yapısı

Backend katmanı (Repository) artık Dexie yerine Supabase kullanmaktadır.

*   `src/lib/supabaseClient.ts`: Supabase bağlantısı
*   `src/data/taskRepository.ts`: Supabase üzerinden görev işlemleri
*   `src/data/categoryRepository.ts`: Supabase üzerinden kategori işlemleri
*   `src/data/settingsRepository.ts`: LocalStorage (Ayarlar yerel kalır)
*   `src/pages/LoginPage.tsx`: Giriş ekranı

## 📝 Lisans

MIT License
