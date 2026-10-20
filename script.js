(() => {
    "use strict";

    /* =====================================================
       DOM туслах функцууд
       ===================================================== */
    const $ = (selector, parent = document) => parent.querySelector(selector);
    const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

    /* =====================================================
       Бүтээгдэхүүний зураг
       Доорх Unsplash холбоосыг HTTP шалгалтаар 200 OK гэж баталсан.
       ===================================================== */
    const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

    const IMG = {
        bear: unsplash("1559454403-b8fb88521f11"),
        train: unsplash("1596461404969-9ae70f2830c1"),
        legoPile: unsplash("1587654780291-39c9404d746b"),
        legoBlue: unsplash("1560961911-ba7ef651a56c"),
        mario: unsplash("1595429035839-c99c298ffdde"),
        marioTrio: unsplash("1566576912321-d58ddd7a6088"),
        rings: unsplash("1618842676088-c4d48a6a7c9d"),
        walle: unsplash("1589254065878-42c9da997008"),
        robot: unsplash("1485827404703-89b55fcc595e"),
        asimo: unsplash("1535378917042-10a22c95931a"),
        car: unsplash("1594736797933-d0501ba2fe65"),
        brushesMacro: unsplash("1513364776144-60967b0f800f"),
        brushesPile: unsplash("1460661419201-fd4cecdf8a8b"),
        abcBlocks: unsplash("1503676260728-1c00da094a0b"),
        paint: unsplash("1541961017774-22349e4a1262"),
        paintKid: unsplash("1503454537195-1dcabb73ffb9"),
        hoop: unsplash("1546519638-68e109498ffc"),
        bball: unsplash("1519861531473-9200262188bf"),
        soccer: unsplash("1575361204480-aadea25e6e68"),
        skate: unsplash("1520045892732-304bc3ac5d8e"),
        gift: unsplash("1549465220-1a8b9238cd48"),
        kids: unsplash("1488521787991-ed7bbaae773c")
    };

    /* =====================================================
       Галерей (демо зургууд — шалгагдсан холбоосууд)
       ===================================================== */
    const galleryItems = [
        { title: "Тоглоомын ертөнц", image: `${IMG.train}`.replace("w=800", "w=1200"), emoji: "🧸" },
        { title: "Бүтээх хүч", image: `${IMG.legoPile}`.replace("w=800", "w=1000"), emoji: "🧩" },
        { title: "Зөөлөн найзууд", image: `${IMG.bear}`.replace("w=800", "w=1000"), emoji: "🧸" },
        { title: "Хөгжүүлэх мөч", image: `${IMG.soccer}`.replace("w=800", "w=1000"), emoji: "⚽" },
        { title: "Баатрын дүр", image: `${IMG.mario}`.replace("w=800", "w=1000"), emoji: "🎎" }
    ];

    /* =====================================================
       localStorage түлхүүрүүд (frontend демо хадгалалт)
       ===================================================== */
    const storageKeys = {
        cart: "happy-toy-cart",
        wishlist: "happy-toy-wishlist",
        saleEnd: "happy-toy-sale-end",
        stock: "happy-toy-stock",
        users: "happy-toy-users",
        session: "happy-toy-session",
        orders: "happy-toy-orders"
    };

    /* =====================================================
       Идэвхтэй төлөв
       ===================================================== */
    const state = {
        cart: readArrayStorage(storageKeys.cart),
        wishlist: readArrayStorage(storageKeys.wishlist),
        stockOverride: readObjectStorage(storageKeys.stock),
        users: readUsersStorage(storageKeys.users),
        session: readStorage(storageKeys.session, null),
        orders: readArrayStorage(storageKeys.orders),
        category: "all",
        query: "",
        sort: "featured",
        saleOnly: false,
        slide: 0,
        accountTab: "login",
        ordersOpen: false,
        profileEditing: false
    };

    let elements = {};
    let slideTimer = null;
    let toastTimer = null;
    let countdownTimer = null;
    let touchStartX = 0;

    /* =====================================================
       Аюулгүй унших/бичих
       ===================================================== */
    function readStorage(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function readArrayStorage(key) {
        const value = readStorage(key, []);
        return Array.isArray(value) ? value : [];
    }

    function readObjectStorage(key) {
        const value = readStorage(key, null);
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    }

    function readUsersStorage(key) {
        const value = readStorage(key, []);
        return Array.isArray(value) ? value : [];
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // localStorage идэвхгүй байвал энэ хуудасны хугацаанд л ажиллана.
        }
    }

    /* =====================================================
       Үнийн формат ба туслах
       ===================================================== */
    function formatPrice(value) {
        return `${Number(value).toLocaleString("en-US")}₮`;
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getProduct(id) {
        return products.find((product) => product.id === id);
    }

    function discountPercent(product) {
        if (!product.oldPrice || product.oldPrice <= product.price) return 0;
        return Math.round((1 - product.price / product.oldPrice) * 100);
    }

    /* =====================================================
       100 бүтээгдэхүүн (демо өгөгдөл)
       Талбарууд: id, name, category, price, oldPrice (сонголттой;
       үргэлж price-аас их байна), rating, reviews, badge
       (сонголттой), stock (0 бол дууссан), age, size, material,
       emoji, image, description
       ===================================================== */
    const products = [
        /* ---------- Чихмэл (16) ---------- */
        { id: "soft-bear-classic", name: "Баавгайн чихмэл тоглоом", category: "soft", price: 35000, oldPrice: 45000, rating: 5, reviews: 128, stock: 24, age: "3–6 нас", size: "32 см", material: "Хөвөн бүрдэл, зөөлөн арьс", emoji: "🧸", image: IMG.bear, description: "Маш зөөлөн, хөөрхөн баавгай — хүүхдийн хамгийн дуртай тоглоомын найз." },
        { id: "soft-bear-big", name: "Баавгайн чихмэл (том)", category: "soft", price: 55000, oldPrice: 65000, rating: 5, reviews: 89, stock: 14, age: "3–7 нас", size: "45 см", material: "Хөвөн бүрдэл, тэрлэн арьс", emoji: "🧸", image: IMG.bear, description: "Том хэмжээний баавгай — орон дээр тулталж унтаж чадна." },
        { id: "soft-bear-mini", name: "Баавгайн чихмэл (жижиг)", category: "soft", price: 25000, rating: 5, reviews: 67, stock: 40, age: "2–5 нас", size: "20 см", material: "Хөвөн бүрдэл", emoji: "🧸", image: IMG.bear, description: "Жижиг, дэгжин баавгай — бэлэг болон аялалдаа авч явахад тохиромжтой." },
        { id: "soft-rabbit", name: "Туулайн чихмэл", category: "soft", price: 30000, oldPrice: 40000, rating: 5, reviews: 183, stock: 18, age: "3–6 нас", size: "30 см", material: "Хөвөн бүрдэл, тэрлэн арьс", emoji: "🐰", image: IMG.bear, description: "Урт чихтэй, маш зөөлөн туулай — хүүхдийг тайвшруулах зөөлөн найз." },
        { id: "soft-panda", name: "Пандын чихмэл", category: "soft", price: 38000, oldPrice: 44000, rating: 5, reviews: 96, stock: 22, age: "4–8 нас", size: "28 см", material: "Хөвөн бүрдэл", emoji: "🐼", image: IMG.bear, description: "Хар цагаан өнгийн хөөрхөн панда — өрөөний сайхан дурсамж." },
        { id: "soft-cat", name: "Муурийн чихмэл", category: "soft", price: 27000, rating: 4, reviews: 54, stock: 31, age: "2–6 нас", size: "26 см", material: "Хөвөн бүрдэл", emoji: "🐱", image: IMG.bear, description: "Зөөлөн муурийн чихмэл — бага насны хүүхдийн эхний найз." },
        { id: "soft-dog", name: "Нохойн чихмэл", category: "soft", price: 26000, oldPrice: 32000, rating: 5, reviews: 71, stock: 19, age: "3–7 нас", size: "27 см", material: "Хөвөн бүрдэл, аюулгүй нийлэг", emoji: "🐶", image: IMG.bear, description: "Хөөрхөн нохойн чихмэл — аюулгүй материалтай, уян хатан найз." },
        { id: "soft-frog", name: "Мэлхийн чихмэл", category: "soft", price: 22000, rating: 4, reviews: 40, stock: 27, age: "3–7 нас", size: "24 см", material: "Хөвөн бүрдэл", emoji: "🐸", image: IMG.bear, description: "Ногоон өнгийн зөөлөн мэлхий — инээдтэй хэлбэртэй, аюулгүй." },
        { id: "soft-lion", name: "Арслангийн чихмэл", category: "soft", price: 42000, rating: 5, reviews: 55, stock: 16, age: "4–8 нас", size: "31 см", material: "Хөвөн бүрдэл, тэрлэн арьс", emoji: "🦁", image: IMG.bear, description: "Сарсан оройтой хөөрхөн арслан — бахархалтай захиалгаар олддог тоглоом." },
        { id: "soft-deer", name: "Зээрийн чихмэл", category: "soft", price: 34000, rating: 4, reviews: 42, stock: 33, age: "3–7 нас", size: "29 см", material: "Хөвөн бүрдэл", emoji: "🦌", image: IMG.bear, description: "Амархан харах зээрийн чихмэл — орон дээр тавтай дурсгагч найз." },
        { id: "soft-gift", name: "Бэлгийн чихмэл багц (2 тоглоом)", category: "soft", price: 58000, oldPrice: 69000, rating: 5, reviews: 77, stock: 12, age: "3–8 нас", size: "Хайрцаг 30×22 см", material: "Хөвөн бүрдэл, гоёмсог савлагаа", emoji: "🎁", image: IMG.gift, description: "Бэлгийн савлагаатай багц — 2 ширхэг хөвөн бүрдэл тоглоомтой." },
        { id: "soft-pillow", name: "Баавгайн дэр (зөөлөн)", category: "soft", price: 23000, rating: 4, reviews: 35, stock: 36, age: "2–6 нас", size: "23 см", material: "Хөвөн бүрдэл", emoji: "🧸", image: IMG.bear, description: "Орон дээр тулталж унтах зөөлөн баавгайн дэр — амар хөөрхөн ерөөс." },
        { id: "soft-mouse", name: "Хулганы чихмэл", category: "soft", price: 17000, rating: 4, reviews: 28, stock: 44, age: "2–5 нас", size: "14 см", material: "Хөвөн бүрдэл", emoji: "🐭", image: IMG.bear, description: "Жижиг, зөөлөн хулганы чихмэл — бага хэмжээний эхний найз." },
        { id: "soft-dragon", name: "Луугийн чихмэл", category: "soft", price: 36000, rating: 5, reviews: 61, stock: 21, age: "4–9 нас", size: "34 см", material: "Хөвөн бүрдэл", emoji: "🐲", image: IMG.bear, description: "Хоймор могойн хөөрхөн луу — адал явдалтай тоглох дуртай найз." },
        { id: "soft-snowman", name: "Цасан хүн чихмэл", category: "soft", price: 19000, rating: 4, reviews: 24, stock: 38, age: "2–6 нас", size: "22 см", material: "Хөвөн бүрдэл", emoji: "⛄", image: IMG.bear, description: "Амархан инээдтэй цасан хүн — өвлийн сайхан бэлэг." },
        { id: "soft-elephant", name: "Зааны чихмэл тоглоом", category: "soft", price: 28000, rating: 4, reviews: 37, stock: 27, age: "3–6 нас", size: "25 см", material: "Хөвөн бүрдэл", emoji: "🐘", image: IMG.bear, description: "Том чихтэй, зөөлөн заан — хүүхдийн эхний найз." },

        /* ---------- Машин (16) ---------- */
        { id: "car-rc", name: "Удирдлагатай RC машин", category: "car", price: 55000, rating: 5, reviews: 96, stock: 30, age: "5–9 нас", size: "1:24 хэмжээ", material: "Хуванцар, металл", emoji: "🚗", image: IMG.car, description: "Удирдлагатай RC машин нь 2.4G удирдлагатай, хурдан хөдөлгөөнт. Хөнгөн, авч явахад амар." },
        { id: "car-rc-sport", name: "Удирдлагатай спорт машин", category: "car", price: 75000, rating: 5, reviews: 64, stock: 4, age: "6–10 нас", size: "1:18 хэмжээ", material: "Хуванцар, металл", emoji: "🏎️", image: IMG.car, description: "Удирдлагатай спорт машин — Супер спорт дизайнтай, түргэн уралдаант. Идэвхтэй тоглолтод зориулсан сонголт." },
        { id: "car-rc-jeep", name: "Удирдлагатай жийп", category: "car", price: 85000, oldPrice: 95000, rating: 5, reviews: 43, stock: 18, age: "6–10 нас", size: "1:16 хэмжээ", material: "Хуванцар, металл", emoji: "🚙", image: IMG.car, description: "Удирдлагатай жийп — Том дугуйтай, барзгар зам өнгөрнө. Аюулгүй материал, бат бэх угсралттай." },
        { id: "car-rc-tractor", name: "Удирдлагатай трактор", category: "car", price: 62000, rating: 4, reviews: 31, stock: 25, age: "5–9 нас", size: "1:20 хэмжээ", material: "Хуванцар", emoji: "🚜", image: IMG.car, description: "Удирдлагатай трактор: Ажлын фермерийн хэлбэртэй. Хүүхдийн дуртай хувилбар." },
        { id: "car-train", name: "Модон галт тэрэг", category: "car", price: 48000, rating: 5, reviews: 210, stock: 22, age: "3–7 нас", size: "28 төмөр хэсэг", material: "Мод, эко барилын будаг", emoji: "🚂", image: IMG.train, description: "Модон галт тэрэг нь Модон рельстэй, аюулгүй материалтай. Хөнгөн, авч явахад амар." },
        { id: "car-fire", name: "Гал сөнөөгч машины тоглоом", category: "car", price: 24000, oldPrice: 30000, rating: 4, reviews: 52, stock: 26, age: "3–7 нас", size: "15 см", material: "Хуванцар", emoji: "🚒", image: IMG.car, description: "Гал сөнөөгч машины тоглоом — Хөдөлгөөнт шат, аюулгүй дугуйтай. Идэвхтэй тоглолтод зориулсан сонголт." },
        { id: "car-bus", name: "Автобусны тоглоом", category: "car", price: 19000, rating: 4, reviews: 38, stock: 41, age: "3–8 нас", size: "16 см", material: "Хуванцар", emoji: "🚌", image: IMG.car, description: "Автобусны тоглоом — Нээгдэх хаалгатай. Аюулгүй материал, бат бэх угсралттай." },
        { id: "car-set6", name: "Автомашины эвлүүлэг (6 ширхэг)", category: "car", price: 32000, rating: 5, reviews: 84, stock: 34, age: "3–8 нас", size: "6×7 см", material: "Металл, хуванцар", emoji: "🚗", image: IMG.car, description: "Автомашины эвлүүлэг (6 ширхэг): 6 төрлийн хотын машин нэг багцад. Хүүхдийн дуртай хувилбар." },
        { id: "car-track", name: "Автомашины уралдааны зам", category: "car", price: 45000, oldPrice: 55000, rating: 5, reviews: 71, stock: 15, age: "4–10 нас", size: "3.6 м сүлжээ", material: "Хуванцар", emoji: "🏁", image: IMG.car, description: "Автомашины уралдааны зам нь Уралдааны 2 зам, хурдан машинтай. Хөнгөн, авч явахад амар." },
        { id: "car-police", name: "Цагдаагийн машины тоглоом", category: "car", price: 18000, rating: 4, reviews: 47, stock: 29, age: "3–8 нас", size: "14 см", material: "Хуванцар", emoji: "🚓", image: IMG.car, description: "Цагдаагийн машины тоглоом — Чичилгээтэй чимэглэлтэй. Идэвхтэй тоглолтод зориулсан сонголт." },
        { id: "car-ambulance", name: "Түргэн тусламжийн тоглоом", category: "car", price: 18000, rating: 4, reviews: 33, stock: 27, age: "3–8 нас", size: "14 см", material: "Хуванцар", emoji: "🚑", image: IMG.car, description: "Түргэн тусламжийн тоглоом — Байрны ажиллагаатай хаалгатай. Аюулгүй материал, бат бэх угсралттай." },
        { id: "car-monster", name: "Том дугуйтай машин (монстр трак)", category: "car", price: 36000, rating: 5, reviews: 58, stock: 21, age: "5–10 нас", size: "18 см", material: "Хуванцар, металл", emoji: "🛻", image: IMG.car, description: "Том дугуйтай машин (монстр трак): Өргөсөн дугуйтай, босогч давж гарна. Хүүхдийн дуртай хувилбар." },
        { id: "car-mini3", name: "Жижиг машин эвлүүлэг (3 ширхэг)", category: "car", price: 14000, rating: 4, reviews: 25, stock: 48, age: "2–6 нас", size: "3×6 см", material: "Хуванцар", emoji: "🚗", image: IMG.car, description: "Жижиг машин эвлүүлэг (3 ширхэг) нь Бага насны хүүхдэд зориулсан. Хөнгөн, авч явахад амар." },
        { id: "car-garage", name: "Машины гаражийн тоглоом", category: "car", price: 29000, oldPrice: 35000, rating: 4, reviews: 39, stock: 23, age: "3–8 нас", size: "34×20 см", material: "Хуванцар", emoji: "🏢", image: IMG.car, description: "Машины гаражийн тоглоом — Автомашины давхар гараж, лифттэй. Идэвхтэй тоглолтод зориулсан сонголт." },
        { id: "car-cement", name: "Цемент зөөгч тоглоом", category: "car", price: 21000, rating: 4, reviews: 29, stock: 32, age: "3–8 нас", size: "16 см", material: "Хуванцар", emoji: "🚛", image: IMG.car, description: "Цемент зөөгч тоглоом — Эргэдэг барабантай, цементээ зөөнө. Аюулгүй материал, бат бэх угсралттай." },
        { id: "car-taxi", name: "Таксийн машины тоглоом", category: "car", price: 17000, rating: 4, reviews: 21, stock: 40, age: "3–8 нас", size: "13 см", material: "Хуванцар", emoji: "🚕", image: IMG.car, description: "Таксийн машины тоглоом: Шар өнгийн сонгодог загвар. Хүүхдийн дуртай хувилбар." },

        /* ---------- Угсардаг (18) ---------- */
        { id: "lego-classic", name: "Сонгодог угсруулагч багц", category: "lego", price: 42000, rating: 5, reviews: 143, stock: 26, age: "4–10 нас", size: "480 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoPile, description: "Сонгодог угсруулагч багц нь 480 хэсэг, чөлөөт бүтээмж. Угсрахад хялбар." },
        { id: "lego-duplo", name: "ДЮПЛО угсруулагч (том хэсэг)", category: "lego", price: 34000, oldPrice: 41000, rating: 5, reviews: 88, stock: 21, age: "2–5 нас", size: "60 хэсэг", material: "Аюулгүй хуванцар", emoji: "🧩", image: IMG.rings, description: "ДЮПЛО угсруулагч (том хэсэг) — Том хэсэгтэй, бага насанд. Олон жил тоглохуйц чанартай." },
        { id: "lego-city", name: "Хотын полиц станц", category: "lego", price: 68000, rating: 5, reviews: 65, stock: 12, age: "6–12 нас", size: "700 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoBlue, description: "Хотын полиц станц — Станц, автомашинаар бүрдсэн. Аюулгүй материал, бат бэх хэсгүүд." },
        { id: "lego-fire", name: "Гал сөнөөгчийн станц", category: "lego", price: 62000, oldPrice: 74000, rating: 5, reviews: 54, stock: 14, age: "6–12 нас", size: "640 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoPile, description: "Гал сөнөөгчийн станц: Гал машин, авто шаттай. Хүүхдийн дуртай хувилбар." },
        { id: "lego-technic", name: "Техник уралдааны машин", category: "lego", price: 78000, rating: 4, reviews: 41, stock: 3, age: "8–14 нас", size: "512 хэсэг", material: "Хуванцар, металл дэл", emoji: "🧩", image: IMG.car, description: "Техник уралдааны машин нь Ажиллагаатай хөдөлгүүртэй. Угсрахад хялбар." },
        { id: "lego-space", name: "Сансрын судлалын станц", category: "lego", price: 74000, rating: 5, reviews: 58, stock: 13, age: "7–12 нас", size: "520 хэсэг", material: "Хуванцар", emoji: "🚀", image: IMG.robot, description: "Сансрын судлалын станц — Ракет, станцтой бүрдэл. Олон жил тоглохуйц чанартай." },
        { id: "lego-animals", name: "Амьтны ертөнцийн багц", category: "lego", price: 24000, rating: 4, reviews: 49, stock: 30, age: "3–8 нас", size: "150 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoPile, description: "Амьтны ертөнцийн багц — 8 амьтны загвар. Аюулгүй материал, бат бэх хэсгүүд." },
        { id: "lego-farm", name: "Фермын багц", category: "lego", price: 36000, oldPrice: 43000, rating: 4, reviews: 36, stock: 18, age: "4–9 нас", size: "240 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.rings, description: "Фермын багц: Фермер, амьтадтай. Хүүхдийн дуртай хувилбар." },
        { id: "lego-pirate", name: "Далайн дээрэмчдийн хөлөг", category: "lego", price: 56000, rating: 5, reviews: 44, stock: 11, age: "7–12 нас", size: "430 хэсэг", material: "Хуванцар", emoji: "⚓", image: IMG.legoBlue, description: "Далайн дээрэмчдийн хөлөг нь Хөлөг онгоц, ахмад дүртэй. Угсрахад хялбар." },
        { id: "lego-dinosaur", name: "Динозаврын ертөнц", category: "lego", price: 48000, rating: 5, reviews: 92, stock: 16, age: "5–10 нас", size: "380 хэсэг", material: "Хуванцар", emoji: "🦖", image: IMG.legoPile, description: "Динозаврын ертөнц — Т-Рекс загвартай. Олон жил тоглохуйц чанартай." },
        { id: "lego-castle", name: "Гүнжийн цамхаг", category: "lego", price: 44000, oldPrice: 52000, rating: 4, reviews: 61, stock: 15, age: "5–10 нас", size: "340 хэсэг", material: "Хуванцар", emoji: "🏰", image: IMG.rings, description: "Гүнжийн цамхаг — Цамхаг, гүнжийн өрөөтэй. Аюулгүй материал, бат бэх хэсгүүд." },
        { id: "lego-robot", name: "Роботын эвлүүлэг", category: "lego", price: 71000, rating: 5, reviews: 73, stock: 10, age: "8–13 нас", size: "480 хэсэг", material: "Хуванцар, электрон", emoji: "🤖", image: IMG.robot, description: "Роботын эвлүүлэг: Хөдөлгөөнт робот бүтээнэ. Хүүхдийн дуртай хувилбар." },
        { id: "lego-train", name: "Угсардаг галт тэрэг", category: "lego", price: 52000, rating: 5, reviews: 57, stock: 17, age: "5–10 нас", size: "320 хэсэг", material: "Хуванцар", emoji: "🚂", image: IMG.legoPile, description: "Угсардаг галт тэрэг нь Рельс, моторт тэрэгтэй. Угсрахад хялбар." },
        { id: "lego-street", name: "Хотын гудамжны багц", category: "lego", price: 40000, rating: 4, reviews: 28, stock: 19, age: "6–11 нас", size: "260 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoBlue, description: "Хотын гудамжны багц — Дэлгүүр, тэрэг, хүмүүстэй. Олон жил тоглохуйц чанартай." },
        { id: "lego-racecar", name: "Уралдааны машин (угсардаг)", category: "lego", price: 29000, rating: 4, reviews: 81, stock: 28, age: "5–9 нас", size: "180 хэсэг", material: "Хуванцар", emoji: "🏎️", image: IMG.car, description: "Уралдааны машин (угсардаг) — 3 хувилбар бүтээж болно. Аюулгүй материал, бат бэх хэсгүүд." },
        { id: "lego-house", name: "Анхны байшин багц", category: "lego", price: 27000, oldPrice: 33000, rating: 4, reviews: 39, stock: 24, age: "4–9 нас", size: "170 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoPile, description: "Анхны байшин багц: Тавилгатай өрөө бүхий. Хүүхдийн дуртай хувилбар." },
        { id: "lego-multi", name: "Олон загвартай багц (12 в 1)", category: "lego", price: 22000, rating: 4, reviews: 46, stock: 32, age: "4–10 нас", size: "120 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.rings, description: "Олон загвартай багц (12 в 1) нь 12 төрлийн загвар барна. Угсрахад хялбар." },
        { id: "lego-arch", name: "Их угсралтын иж бүрдэл", category: "lego", price: 98000, oldPrice: 115000, rating: 5, reviews: 120, stock: 0, age: "6–12 нас", size: "1100 хэсэг", material: "Хуванцар", emoji: "🧩", image: IMG.legoPile, description: "Их угсралтын иж бүрдэл — Их бүрдэл, 40 загвартай. Олон жил тоглохуйц чанартай." },

        /* ---------- Хүүхэлдэй (16) ---------- */
        { id: "doll-hair", name: "Үстэй хүүхэлдэй (30 см)", category: "doll", price: 32000, oldPrice: 38000, rating: 5, reviews: 97, stock: 15, age: "4–9 нас", size: "30 см", material: "Хөв, хуванцар", emoji: "👱", image: IMG.mario, description: "Үстэй хүүхэлдэй (30 см) — Үсийг нь засаж болно. Бэлэг болох сайн сонголт." },
        { id: "doll-princess", name: "Гүнжийн хүүхэлдэй", category: "doll", price: 28000, rating: 5, reviews: 84, stock: 20, age: "3–8 нас", size: "28 см", material: "Хуванцар, даавуу", emoji: "👗", image: IMG.gift, description: "Гүнжийн хүүхэлдэй — Гүнжийн хувцастай. Зөөлөн, хүүхдэд аюулгүй." },
        { id: "doll-princess-red", name: "Улаан гүнж хүүхэлдэй", category: "doll", price: 29000, rating: 4, reviews: 52, stock: 4, age: "3–8 нас", size: "28 см", material: "Хуванцар, даавуу", emoji: "👗", image: IMG.gift, description: "Улаан гүнж хүүхэлдэй: Улаан маягийн хувцастай. Хүүхдийн дуртай тоглолт." },
        { id: "doll-baby", name: "Нярай хүүхэлдэй", category: "doll", price: 26000, rating: 5, reviews: 66, stock: 23, age: "2–6 нас", size: "24 см", material: "Хөв, зөөлөн хуванцар", emoji: "👶", image: IMG.mario, description: "Нярай хүүхэлдэй нь Чимээ гаргадаг. Бага насны дуртай сонголт." },
        { id: "doll-twin", name: "Хос хүүхэлдэй", category: "doll", price: 38000, oldPrice: 46000, rating: 5, reviews: 43, stock: 12, age: "3–8 нас", size: "26×2 см", material: "Хуванцар, хөв", emoji: "👭", image: IMG.marioTrio, description: "Хос хүүхэлдэй — 2 хүүхэлдэй, 4 хувцастай. Бэлэг болох сайн сонголт." },
        { id: "doll-house", name: "Хүүхэлдэйний байшин", category: "doll", price: 89000, rating: 5, reviews: 110, stock: 2, age: "3–10 нас", size: "62×34 см", material: "Мод, хуванцар", emoji: "🏠", image: IMG.marioTrio, description: "Хүүхэлдэйний байшин — Хоёр давхар, тавилгатай. Зөөлөн, хүүхдэд аюулгүй." },
        { id: "doll-furniture", name: "Тавилгын багц", category: "doll", price: 34000, rating: 4, reviews: 31, stock: 26, age: "3–9 нас", size: "24 хэсэг", material: "Мод", emoji: "🛋️", image: IMG.marioTrio, description: "Тавилгын багц: 24 ширхэг тавилга. Хүүхдийн дуртай тоглолт." },
        { id: "doll-bed", name: "Хүүхэлдэйний орон", category: "doll", price: 22000, rating: 4, reviews: 27, stock: 0, age: "2–7 нас", size: "36×22 см", material: "Мод, даавуу", emoji: "🛏️", image: IMG.marioTrio, description: "Хүүхэлдэйний орон нь Хөнжил, дэр бүхий. Бага насны дуртай сонголт." },
        { id: "doll-outfit", name: "Хүүхэлдэйний хувцас (6 маяг)", category: "doll", price: 18000, rating: 4, reviews: 38, stock: 33, age: "3–9 нас", size: "6 маяг", material: "Даавуу, хөв", emoji: "👚", image: IMG.gift, description: "Хүүхэлдэйний хувцас (6 маяг) — Гутал бүхий. Бэлэг болох сайн сонголт." },
        { id: "doll-tea", name: "Цайны багц", category: "doll", price: 19000, oldPrice: 24000, rating: 4, reviews: 57, stock: 29, age: "3–8 нас", size: "17 хэсэг", material: "Хуванцар", emoji: "🍵", image: IMG.gift, description: "Цайны багц — Аяга, таваг бүрэн. Зөөлөн, хүүхдэд аюулгүй." },
        { id: "doll-kitchen", name: "Гал тогооны багц", category: "doll", price: 45000, oldPrice: 53000, rating: 5, reviews: 74, stock: 13, age: "3–9 нас", size: "60×28 см", material: "Хуванцар", emoji: "🍳", image: IMG.marioTrio, description: "Гал тогооны багц: Аяга таваг, ногоо бүхий. Хүүхдийн дуртай тоглолт." },
        { id: "doll-doctor", name: "Эмчийн багц", category: "doll", price: 21000, rating: 4, reviews: 46, stock: 31, age: "4–9 нас", size: "12 хэсэг", material: "Аюулгүй хуванцар", emoji: "🩺", image: IMG.gift, description: "Эмчийн багц нь Стетоскоптой. Бага насны дуртай сонголт." },
        { id: "doll-bath", name: "Усанд оршдог хүүхэлдэй", category: "doll", price: 14000, rating: 4, reviews: 35, stock: 37, age: "1–5 нас", size: "18 см", material: "Аюулгүй хуванцар", emoji: "🛁", image: IMG.mario, description: "Усанд оршдог хүүхэлдэй — Усанд тоглох аюулгүй. Бэлэг болох сайн сонголт." },
        { id: "doll-music", name: "Дуутай хүүхэлдэй", category: "doll", price: 24000, oldPrice: 29000, rating: 4, reviews: 29, stock: 22, age: "2–6 нас", size: "24 см", material: "Хөв, электрон", emoji: "🎀", image: IMG.mario, description: "Дуутай хүүхэлдэй — Дуу хөгжим гаргадаг. Зөөлөн, хүүхдэд аюулгүй." },
        { id: "doll-keychain", name: "Гарын жижиг хүүхэлдэй", category: "doll", price: 6500, rating: 4, reviews: 18, stock: 42, age: "3–10 нас", size: "8 см", material: "Хөв", emoji: "🎎", image: IMG.gift, description: "Гарын жижиг хүүхэлдэй: Түлхүүр дээр өлгөнө. Хүүхдийн дуртай тоглолт." },
        { id: "doll-wedding", name: "Бэлгийн хүүхэлдэй (баглаатай)", category: "doll", price: 24000, oldPrice: 30000, rating: 5, reviews: 49, stock: 17, age: "4–10 нас", size: "32 см", material: "Хөв, даавуу", emoji: "💐", image: IMG.gift, description: "Бэлгийн хүүхэлдэй (баглаатай) нь Бэлгийн савлагаатай. Бага насны дуртай сонголт." },

        /* ---------- Спорт (18) ---------- */
        { id: "sport-ball", name: "Хөл бөмбөг (№5)", category: "sport", price: 16000, rating: 4, reviews: 88, stock: 45, age: "6–14 нас", size: "Ø 22 см", material: "PU арьс", emoji: "⚽", image: IMG.bball, description: "Хөл бөмбөг (№5): №5 хэмжээ, зөөлөн. Идэвхтэй тоглолтын хэрэгсэл." },
        { id: "sport-basket", name: "Сагсан бөмбөг (№7)", category: "sport", price: 22000, rating: 4, reviews: 64, stock: 30, age: "8–14 нас", size: "Ø 24 см", material: "PU арьс", emoji: "🏀", image: IMG.bball, description: "Сагсан бөмбөг (№7) нь №7 хэмжээ. Хөдөлгөөнд сайн." },
        { id: "sport-volley", name: "Волейболын бөмбөг", category: "sport", price: 18000, rating: 4, reviews: 41, stock: 25, age: "10–16 нас", size: "Ø 21 см", material: "PU арьс", emoji: "🏐", image: IMG.bball, description: "Волейболын бөмбөг — Хөнгөн, зөөлөн. Багийн тоглолтод тохирно." },
        { id: "sport-hoop", name: "Сагсны тоглоомын багц", category: "sport", price: 34000, oldPrice: 41000, rating: 5, reviews: 76, stock: 0, age: "3–10 нас", size: "110 см өндөр", material: "Хуванцар, төмөр", emoji: "🏀", image: IMG.hoop, description: "Сагсны тоглоомын багц — Өндөр нь тохируулдаг. Спортын хэрэгсэл бат бэх." },
        { id: "sport-badminton", name: "Бадминтоны багц", category: "sport", price: 19000, rating: 4, reviews: 52, stock: 34, age: "6–12 нас", size: "62 см", material: "Металл, хуванцар", emoji: "🏸", image: IMG.soccer, description: "Бадминтоны багц: 2 бамбар, хайрцагтай. Идэвхтэй тоглолтын хэрэгсэл." },
        { id: "sport-table", name: "Пин-понгийн ширээ", category: "sport", price: 165000, oldPrice: 189000, rating: 5, reviews: 23, stock: 8, age: "6–14 нас", size: "150×70 см", material: "Хуванцар, төмөр хөл", emoji: "🏓", image: IMG.soccer, description: "Пин-понгийн ширээ нь Эвхэгддэг хөлтэй. Хөдөлгөөнд сайн." },
        { id: "sport-tennis", name: "Пин-понгийн багц", category: "sport", price: 12000, rating: 4, reviews: 66, stock: 50, age: "5–12 нас", size: "Бамбар 16 см", material: "Мод, хуванцар", emoji: "🏓", image: IMG.soccer, description: "Пин-понгийн багц — Бамбар, бөмбөгтэй. Багийн тоглолтод тохирно." },
        { id: "sport-bike", name: "Хүүхдийн дугуй (12 инч)", category: "sport", price: 189000, rating: 5, reviews: 34, stock: 12, age: "3–6 нас", size: "12 инч", material: "Ган хүрээ", emoji: "🚲", image: IMG.skate, description: "Хүүхдийн дугуй (12 инч) — Нэмэлт дугуй, тоормостой. Спортын хэрэгсэл бат бэх." },
        { id: "sport-scooter", name: "Хүүхдийн скутер", category: "sport", price: 95000, oldPrice: 110000, rating: 4, reviews: 47, stock: 2, age: "5–10 нас", size: "Тулгуур 60 см", material: "Алюминий, хуванцар", emoji: "🛴", image: IMG.skate, description: "Хүүхдийн скутер: Эвхэгддэг. Идэвхтэй тоглолтын хэрэгсэл." },
        { id: "sport-skate", name: "Скэйтборд", category: "sport", price: 52000, rating: 4, reviews: 29, stock: 5, age: "8–14 нас", size: "61 см", material: "Мод, алюминий", emoji: "🛹", image: IMG.skate, description: "Скэйтборд нь Дугуй эргэлт хурдан. Хөдөлгөөнд сайн." },
        { id: "sport-balance", name: "Баланс дугуй", category: "sport", price: 129000, rating: 5, reviews: 26, stock: 9, age: "2–5 нас", size: "10 инч", material: "Ган хүрээ", emoji: "🚲", image: IMG.skate, description: "Баланс дугуй — Педалгүй, тэнцвэр сургана. Багийн тоглолтод тохирно." },
        { id: "sport-boxing", name: "Боксны бээлий", category: "sport", price: 17000, rating: 4, reviews: 58, stock: 26, age: "5–11 нас", size: "22 см", material: "Хуванцар арьс, хөв дотор", emoji: "🥊", image: IMG.kids, description: "Боксны бээлий — Зөөлөн, аюулгүй. Спортын хэрэгсэл бат бэх." },
        { id: "sport-frisbee", name: "Фризби", category: "sport", price: 6000, rating: 4, reviews: 21, stock: 60, age: "4–12 нас", size: "Ø 22 см", material: "Аюулгүй хуванцар", emoji: "🥏", image: IMG.kids, description: "Фризби: Гадна тоглолтод тохиромжтой. Идэвхтэй тоглолтын хэрэгсэл." },
        { id: "sport-stick", name: "Хула бамбар", category: "sport", price: 17500, rating: 4, reviews: 19, stock: 22, age: "6–12 нас", size: "70 см", material: "Хуванцар, мод", emoji: "🏑", image: IMG.soccer, description: "Хула бамбар нь Бөмбөг бүхий багц. Хөдөлгөөнд сайн." },
        { id: "sport-golf", name: "Гольфын мини тоглоом", category: "sport", price: 14000, rating: 4, reviews: 24, stock: 18, age: "5–11 нас", size: "Хоса 60 см", material: "Хуванцар, металл", emoji: "⛳", image: IMG.kids, description: "Гольфын мини тоглоом — 3 бөмбөг, 2 нүхтэй. Багийн тоглолтод тохирно." },
        { id: "sport-swim", name: "Усанд сэлэгчийн багц", category: "sport", price: 8500, oldPrice: 9900, rating: 4, reviews: 37, stock: 33, age: "4–12 нас", size: "Нэг хэмжээ", material: "Аюулгүй хуванцар", emoji: "🩱", image: IMG.kids, description: "Усанд сэлэгчийн багц — Нүдний шил, бамбайтай. Спортын хэрэгсэл бат бэх." },
        { id: "sport-set", name: "Спортын эхний багц", category: "sport", price: 33000, rating: 4, reviews: 43, stock: 14, age: "5–11 нас", size: "6 хэрэгсэл", material: "Хуванцар", emoji: "🎽", image: IMG.kids, description: "Спортын эхний багц: 6 төрлийн хэрэгсэлтэй. Идэвхтэй тоглолтын хэрэгсэл." },
        { id: "sport-darts", name: "Дартс (магниттэй)", category: "sport", price: 16000, rating: 4, reviews: 31, stock: 20, age: "6–12 нас", size: "Талбай 32 см", material: "Магнит, хуванцар", emoji: "🎯", image: IMG.kids, description: "Дартс (магниттэй) нь Магниттэй, аюулгүй. Хөдөлгөөнд сайн." },

        /* ---------- Бамбуруш (16) ---------- */
        { id: "bbrush-water24", name: "Усан будаг (24 өнгө)", category: "bambruush", price: 7500, oldPrice: 9000, rating: 5, reviews: 92, stock: 55, age: "3–10 нас", size: "24 өнгө", material: "Аюулгүй пигмент", emoji: "🎨", image: IMG.paint, description: "Усан будаг (24 өнгө) — Усаар угаардаг. Бүх материал нь аюулгүй." },
        { id: "bbrush-water12", name: "Усан будаг (12 өнгө)", category: "bambruush", price: 4900, rating: 4, reviews: 61, stock: 60, age: "3–8 нас", size: "12 өнгө", material: "Аюулгүй пигмент", emoji: "🎨", image: IMG.paint, description: "Усан будаг (12 өнгө): Эхлэгчид зориулсан. Уран бүтээлд ашигтай." },
        { id: "bbrush-acrylic", name: "Акрил будгийн багц", category: "bambruush", price: 12000, rating: 4, reviews: 35, stock: 24, age: "6–12 нас", size: "12 тун", material: "Акрил пигмент", emoji: "🖌️", image: IMG.paint, description: "Акрил будгийн багц нь Хурдан хатаадаг. Хялбар, сонирхолтой." },
        { id: "bbrush-brush", name: "Худар эвлүүлэг (10 ширхэг)", category: "bambruush", price: 6500, rating: 4, reviews: 48, stock: 42, age: "3–12 нас", size: "Өөр өөр хэмжээ", material: "Синтетик, модон бариултай", emoji: "🖌️", image: IMG.brushesMacro, description: "Худар эвлүүлэг (10 ширхэг) — 10 хэмжээний худар. Бэлэг түгээхэд сайн." },
        { id: "bbrush-canvas", name: "Зураг самбар (канвас 5 ш)", category: "bambruush", price: 8500, rating: 4, reviews: 30, stock: 30, age: "5–12 нас", size: "20×20 см", material: "Даавуун канвас", emoji: "🖼️", image: IMG.brushesPile, description: "Зураг самбар (канвас 5 ш) — Шууд зурж болно. Бүх материал нь аюулгүй." },
        { id: "bbrush-pastel", name: "Тосон пастель (24 өнгө)", category: "bambruush", price: 9900, oldPrice: 11500, rating: 4, reviews: 28, stock: 28, age: "5–12 нас", size: "24 өнгө", material: "Тосон, пигмент", emoji: "🖍️", image: IMG.brushesPile, description: "Тосон пастель (24 өнгө): Гүн, цэвэр өнгөтэй. Уран бүтээлд ашигтай." },
        { id: "bbrush-plasticine", name: "Пластилин (12 өнгө)", category: "bambruush", price: 5500, rating: 5, reviews: 74, stock: 44, age: "2–7 нас", size: "12 өнгө", material: "Аюулгүй материал", emoji: "🎨", image: IMG.brushesMacro, description: "Пластилин (12 өнгө) нь Хэлбэр өөрчлөхөд амар. Хялбар, сонирхолтой." },
        { id: "bbrush-slime", name: "Слайм (гялгар хөөс)", category: "bambruush", price: 7900, oldPrice: 9500, rating: 4, reviews: 66, stock: 25, age: "5–11 нас", size: "250 г", material: "Аюулгүй полимер", emoji: "🎨", image: IMG.paintKid, description: "Слайм (гялгар хөөс) — Сунаж, гялгардаг. Бэлэг түгээхэд сайн." },
        { id: "bbrush-sand", name: "Өнгөт элсний урлалын багц", category: "bambruush", price: 9800, rating: 4, reviews: 51, stock: 27, age: "4–10 нас", size: "8 өнгө", material: "Аюулгүй элс", emoji: "🎨", image: IMG.paintKid, description: "Өнгөт элсний урлалын багц — Хээ дээр цацна. Бүх материал нь аюулгүй." },
        { id: "bbrush-sticker", name: "Стикерын багц", category: "bambruush", price: 3900, rating: 4, reviews: 77, stock: 58, age: "3–10 нас", size: "500 стикер", material: "Хуванцар наалт", emoji: "🌈", image: IMG.brushesMacro, description: "Стикерын багц: Дэвтэр, цонхон дээр наана. Уран бүтээлд ашигтай." },
        { id: "bbrush-marker", name: "Маркерийн багц (12 өнгө)", category: "bambruush", price: 6900, rating: 4, reviews: 43, stock: 38, age: "4–11 нас", size: "12 өнгө", material: "Усан суурьтай", emoji: "🖊️", image: IMG.brushesMacro, description: "Маркерийн багц (12 өнгө) нь Усаар угаардаг, аюулгүй. Хялбар, сонирхолтой." },
        { id: "bbrush-origami", name: "Оригами цаасны багц", category: "bambruush", price: 5200, rating: 4, reviews: 26, stock: 35, age: "5–12 нас", size: "3 хэмжээ", material: "Өнгөт цаас", emoji: "✂️", image: IMG.paintKid, description: "Оригами цаасны багц — Маягийн зураг бүхий. Бэлэг түгээхэд сайн." },
        { id: "bbrush-kinetic", name: "Кинетик элс (1 кг)", category: "bambruush", price: 11500, oldPrice: 13000, rating: 5, reviews: 63, stock: 19, age: "3–10 нас", size: "1 кг", material: "Аюулгүй полимер", emoji: "🎨", image: IMG.paintKid, description: "Кинетик элс (1 кг) — Хэлбэрээ хадгалдаг. Бүх материал нь аюулгүй." },
        { id: "bbrush-frame", name: "Зургийн хүрээ (5 ширхэг)", category: "bambruush", price: 6800, rating: 4, reviews: 22, stock: 21, age: "4–12 нас", size: "18×24 см", material: "Мод, хуванцар", emoji: "🖼️", image: IMG.brushesPile, description: "Зургийн хүрээ (5 ширхэг): Зурсан зургаа хадгална. Уран бүтээлд ашигтай." },
        { id: "bbrush-set", name: "Уран сайхны том багц", category: "bambruush", price: 21000, oldPrice: 25000, rating: 5, reviews: 87, stock: 13, age: "6–12 нас", size: "60 хэсэг", material: "Холимог материал", emoji: "🎨", image: IMG.brushesPile, description: "Уран сайхны том багц нь Будаг, худар, канвастай. Хялбар, сонирхолтой." },
        { id: "bbrush-small", name: "Жижиг урлалын багц", category: "bambruush", price: 4900, rating: 3, reviews: 14, stock: 0, age: "3–8 нас", size: "8 хэсэг", material: "Аюулгүй материал", emoji: "🎨", image: IMG.brushesMacro, description: "Жижиг урлалын багц — Аялалд тохиромжтой. Бэлэг түгээхэд сайн." },
];
