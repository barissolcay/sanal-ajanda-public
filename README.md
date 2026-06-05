# Sanal Ajanda

Supabase destekli, PWA uyumlu kişisel ajanda uygulaması. Görevleri günlük, haftalık, aylık ve yıllık görünümlerde takip edebilir; kategori, öncelik, durum ve tarih aralığına göre düzenleyebilirsiniz.

## Özellikler

- Supabase Auth ile e-posta/şifre girişi
- Kullanıcı bazlı görev ve kategori verileri
- Row Level Security ile her kullanıcının sadece kendi verisini görmesi
- Günlük, haftalık, aylık ve yıllık takvim ekranları
- Özel listeler/kategoriler
- PWA desteği
- Ayarların tarayıcıda yerel tutulması

## Teknolojiler

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- Vitest

## Hızlı Kurulum

Gerekenler:

- Node.js 18 veya üzeri
- npm
- Bir Supabase hesabı

Projeyi indirip bağımlılıkları kurun:

```bash
git clone https://github.com/barissolcay/sanal-ajanda-public.git
cd sanal-ajanda-public
npm install
```

Örnek ortam dosyasını kopyalayın:

```bash
cp .env.example .env
```

Windows PowerShell kullanıyorsanız:

```powershell
Copy-Item .env.example .env
```

`.env` dosyasını kendi Supabase bilgilerinizle doldurun:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Sonra uygulamayı başlatın:

```bash
npm run dev
```

Vite terminalde yerel adresi gösterecek. Genelde `http://localhost:5173` olur.

## Supabase Kurulumu

### 1. Proje Oluşturma

1. [Supabase](https://supabase.com/) hesabınıza girin.
2. Yeni bir proje oluşturun.
3. `Project Settings > API` ekranından `Project URL` ve `anon public` key değerlerini alın.
4. Bu değerleri `.env` dosyasındaki `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` alanlarına yazın.

Güvenlik notu: Frontend projelerinde `VITE_` ile başlayan değişkenler tarayıcıya gider. Bu projede sadece Supabase `anon public` key kullanılmalıdır. `service_role`, secret key, JWT secret veya kişisel token değerlerini asla `.env` dosyasına frontend değişkeni olarak koymayın ve GitHub'a göndermeyin.

### 2. Veritabanı Tabloları

Supabase panelinde `SQL Editor` ekranını açın ve [supabase/schema.sql](supabase/schema.sql) dosyasındaki SQL'i çalıştırın.

Bu SQL şunları oluşturur:

- `public.tasks`
- `public.categories`
- Gerekli indeksler
- Row Level Security politikaları
- `authenticated` rolü için gerekli tablo izinleri

### 3. Authentication Ayarları

Supabase panelinde:

1. `Authentication > Providers > Email` sağlayıcısının açık olduğundan emin olun.
2. Sadece kendi kullanıcınız kullanacaksa `Authentication > Settings` altında yeni kayıtları kapatabilirsiniz.
3. `Authentication > Users` ekranından `Add user` veya `Invite user` ile kullanıcı oluşturun.
4. Uygulamaya bu e-posta ve şifreyle giriş yapın.

Arkadaşınız kendi Supabase projesini açarsa sizin veritabanınıza veya kullanıcılarınıza erişmez. Herkes kendi `.env` değerleriyle kendi Supabase projesine bağlanır.

## Komutlar

```bash
npm run dev      # geliştirme sunucusu
npm run build    # production build
npm run preview  # build sonucunu yerelde önizleme
npm run test     # testleri çalıştır
```

## Deploy

Vercel, Netlify veya benzeri bir platforma deploy ederken environment variable olarak şunları ekleyin:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Deploy sonrası Supabase tarafında gerekirse `Authentication > URL Configuration` bölümünden site adresinizi allowed redirect/site URL olarak ekleyin.

## Proje Yapısı

- `src/lib/supabaseClient.ts`: Supabase client kurulumu
- `src/data/taskRepository.ts`: Görev verilerinin Supabase işlemleri
- `src/data/categoryRepository.ts`: Kategori verilerinin Supabase işlemleri
- `src/data/settingsRepository.ts`: Yerel ayarlar
- `src/pages/LoginPage.tsx`: Giriş ekranı
- `supabase/schema.sql`: Yeni Supabase projesi için veritabanı şeması

## Public Repo Güvenlik Notları

- `.env` dosyası `.gitignore` içindedir ve repoya gönderilmemelidir.
- `.env.example` sadece örnek değerler içerir.
- Supabase `service_role` key frontend uygulamalarda kullanılmaz.
- Public repoyu fork eden kişi kendi Supabase projesini ve kendi ortam değişkenlerini oluşturmalıdır.

## Lisans

MIT
