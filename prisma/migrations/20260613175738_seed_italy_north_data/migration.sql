-- Idempotent data migration: insert شمال إيطاليا destination + areas + attractions + providers + drivers.
-- Guarded by a slug check so it is safe to replay (prisma migrate deploy is idempotent by design,
-- but this guard makes the INSERT block itself safe if somehow re-run).

DO $$
DECLARE
  v_dest   text := 'dest_italy_north';
  v_milan  text := 'area_ita_milan';
  v_duomo  text := 'area_ita_duomo';
  v_brera  text := 'area_ita_brera';
  v_pnmil  text := 'area_ita_porta_nova_mil';
  v_como   text := 'area_ita_como';
  v_comoTn text := 'area_ita_como_town';
  v_bella  text := 'area_ita_bellagio';
  v_varen  text := 'area_ita_varenna';
  v_dolom  text := 'area_ita_dolomites';
  v_corti  text := 'area_ita_cortina';
  v_orti   text := 'area_ita_ortisei';
  v_madel  text := 'area_ita_madeleine';
  v_garda  text := 'area_ita_garda';
  v_sirmi  text := 'area_ita_sirmione';
  v_riva   text := 'area_ita_riva_del';
  v_malce  text := 'area_ita_malcesine';
  v_veron  text := 'area_ita_verona';
  v_verOld text := 'area_ita_verona_old';
  v_pnver  text := 'area_ita_porta_nuova_ver';
  v_cinq   text := 'area_ita_cinque';
  v_monte  text := 'area_ita_monterosso';
  v_vern2  text := 'area_ita_vernazza';
  v_manar  text := 'area_ita_manarola';
  v_miTrp  text := 'prov_ita_milan_transport';
BEGIN
  -- Guard: skip if already inserted
  IF EXISTS (SELECT 1 FROM "Destination" WHERE slug = 'italy-north') THEN
    RETURN;
  END IF;

  -- ── Destination ────────────────────────────────────────────────
  INSERT INTO "Destination" (id, slug, name, country, type, description, image,
    featured, active, "sortOrder", "createdAt", "updatedAt")
  VALUES (
    v_dest, 'italy-north', 'شمال إيطاليا', 'إيطاليا', 'INTERNATIONAL',
    'طبيعة ساحرة، بحيرات خلابة، قرى جميلة ومدن تاريخية — تجربة لا تُنسى في أجمل مناطق إيطاليا. '
    'من كاتدرائية ميلان الشهيرة إلى بحيرة كومو الفاتنة ومرتفعات الدولوميت الثلجية، '
    'وصولاً إلى بحيرة غاردا وفيرونا التاريخية وقرى تشينكوي تيري الساحلية.',
    '/images/italy.svg', true, true, 9, NOW(), NOW()
  );

  -- ── Areas — ميلان ──────────────────────────────────────────────
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_milan, v_dest, NULL,      'CITY',     'ميلان',               1),
    (v_duomo, v_dest, v_milan,   'DISTRICT', 'الدومو — وسط المدينة', 1),
    (v_brera, v_dest, v_milan,   'DISTRICT', 'بريرا',               2),
    (v_pnmil, v_dest, v_milan,   'DISTRICT', 'بورتا نوفا',          3);

  -- Areas — بحيرة كومو
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_como,   v_dest, NULL,    'CITY',     'بحيرة كومو',   2),
    (v_comoTn, v_dest, v_como,  'DISTRICT', 'كومو — المدينة', 1),
    (v_bella,  v_dest, v_como,  'DISTRICT', 'بيلاجيو',      2),
    (v_varen,  v_dest, v_como,  'DISTRICT', 'فارينا',       3);

  -- Areas — الدولوميت
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_dolom, v_dest, NULL,     'REGION', 'الدولوميت',    3),
    (v_corti, v_dest, v_dolom,  'CITY',   'كورتينا برايس', 1),
    (v_orti,  v_dest, v_dolom,  'CITY',   'أورتيسي',      2),
    (v_madel, v_dest, v_dolom,  'CITY',   'سانتا مادلينا', 3);

  -- Areas — بحيرة غاردا
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_garda, v_dest, NULL,     'CITY',     'بحيرة غاردا',   4),
    (v_sirmi, v_dest, v_garda,  'DISTRICT', 'سيرميوني',      1),
    (v_riva,  v_dest, v_garda,  'DISTRICT', 'ريفا ديل غاردا', 2),
    (v_malce, v_dest, v_garda,  'DISTRICT', 'مالتشيزيني',    3);

  -- Areas — فيرونا
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_veron,  v_dest, NULL,     'CITY',     'فيرونا',              5),
    (v_verOld, v_dest, v_veron,  'DISTRICT', 'المدينة القديمة — الأرينا', 1),
    (v_pnver,  v_dest, v_veron,  'DISTRICT', 'بورتا نوفا',          2);

  -- Areas — تشينكوي تيري
  INSERT INTO "Area" (id, "destinationId", "parentId", kind, name, "sortOrder") VALUES
    (v_cinq,  v_dest, NULL,     'REGION',   'تشينكوي تيري', 6),
    (v_monte, v_dest, v_cinq,   'DISTRICT', 'مونتيروسو',    1),
    (v_vern2, v_dest, v_cinq,   'DISTRICT', 'فيرناتسا',     2),
    (v_manar, v_dest, v_cinq,   'DISTRICT', 'مانارولا',     3);

  -- ── Attractions ────────────────────────────────────────────────
  INSERT INTO "Attraction" (id, "areaId", name, category, description, "durationMin") VALUES
    ('attr_ita_duomo_cath',   v_duomo,   'كاتدرائية الدومو',             'LANDMARK',   'أيقونة ميلان وأضخم الكاتدرائيات القوطية في العالم',                          90),
    ('attr_ita_galleria',     v_duomo,   'غاليريا فيتوريو إيمانويل',    'MALL',       'أفخم أسواق التسوق التاريخية في أوروبا',                                      60),
    ('attr_ita_brera_art',    v_brera,   'حي بريرا الفني',               'MUSEUM',     'حي الفنانين بمعارضه وكافيهاته الراقية',                                     120),
    ('attr_ita_como_boats',   v_comoTn,  'جولة قوارب البحيرة',           'ACTIVITY',   'استكشاف قرى الضفاف من البحيرة — أجمل منظر في الشمال الإيطالي',             180),
    ('attr_ita_bellagio',     v_bella,   'قرية بيلاجيو الخلابة',         'LANDMARK',   'جوهرة بحيرة كومو بأزقتها المرصوفة وأزهارها الملونة',                       120),
    ('attr_ita_varenna',      v_varen,   'قرية فارينا التاريخية',        'LANDMARK',   'قرية صيد ساحرة تطل على البحيرة الساكنة',                                     90),
    ('attr_ita_arena',        v_verOld,  'أرينا فيرونا الرومانية',       'LANDMARK',   'مسرح روماني مكشوف من القرن الأول الميلادي — يستضيف أوبرا صيفية',            90),
    ('attr_ita_juliet',       v_verOld,  'شرفة جولييت',                  'LANDMARK',   'شرفة إلهام شكسبير في قلب المدينة القديمة',                                   30),
    ('attr_ita_piazza_erbe',  v_verOld,  'ساحة إيربي والمطاعم',          'RESTAURANT', 'قلب الحياة الليلية والمطبخ الفينيتي الأصيل',                                 90),
    ('attr_ita_monte_beach',  v_monte,   'شاطئ مونتيروسو',               'PARK',       'الشاطئ الوحيد الكبير في تشينكوي تيري',                                      120),
    ('attr_ita_vernaz_port',  v_vern2,   'ميناء فيرناتسا',               'LANDMARK',   'أجمل القرى الخمس: ملوّنة وتطل على البحر مباشرة',                            90),
    ('attr_ita_cinq_trails',  v_manar,   'مسارات المشي الساحلية',        'ACTIVITY',   'مسارات طبيعية تربط القرى الخمس فوق البحر الأزرق',                          240);

  -- ── Service Providers ──────────────────────────────────────────
  INSERT INTO "ServiceProvider" (id, name, type, "contactName", phone, city, "areaId", notes, status, "createdAt", "updatedAt") VALUES
    (v_miTrp,
     'NCC Milano — نقل VIP ميلان',      'TRANSPORT', 'Marco Russo',      '+390245678900', 'ميلان',              v_milan,
     'أسطول مرسيدس E-Class وS-Class — خدمة مطار مالبنسا وليناتي على مدار الساعة', 'ACTIVE', NOW(), NOW()),
    ('prov_ita_hotel_brera',
     'Hotel Brera Milano',               'HOTEL',     'Giulia Ferri',     '+390287654321', 'ميلان',              v_brera,
     'فندق ٤ نجوم في حي بريرا — ٣٠٠ م من غاليريا فيتوريو',                         'ACTIVE', NOW(), NOW()),
    ('prov_ita_como_boats',
     'Lake Como Boats — جولات بحيرة كومو','OTHER',    'Luigi Conti',      '+390341556677', 'كومو',               v_como,
     'قوارب خاصة وجولات جماعية — استقبال العرب يومياً مايو–أكتوبر',                'ACTIVE', NOW(), NOW()),
    ('prov_ita_alpine_tours',
     'Dolomites Alpine Tours',           'TRANSPORT', 'Hans Mayer',       '+390471334455', 'كورتينا دامبيتسو',   v_dolom,
     'تنسيق رحلات جبلية وتزلج والاستقبال من مطار فينيسيا للدولوميت',               'ACTIVE', NOW(), NOW()),
    ('prov_ita_garda_trf',
     'Garda Lake Transfers',             'TRANSPORT', 'Sofia Bianchi',    '+390456789012', 'سيرميوني',           v_garda,
     'نقل خاص بين قرى البحيرة — قوارب للإيجار بالساعة',                            'ACTIVE', NOW(), NOW()),
    ('prov_ita_cinque_guide',
     'Cinque Terre Guide — مرشد تشينكوي تيري','OTHER','Alessandro Costa', '+390187891234', 'مونتيروسو',          v_cinq,
     'مرشد عربي متخصص في مسارات تشينكوي تيري — حجز القطارات المحلية',              'ACTIVE', NOW(), NOW()),
    ('prov_ita_hotel_verona',
     'Hotel Giulietta Verona',           'HOTEL',     'Francesca Rossi',  '+390457890123', 'فيرونا',             v_veron,
     'فندق ٤ نجوم في المدينة القديمة — ٥ دقائق من الأرينا الرومانية',              'ACTIVE', NOW(), NOW());

  -- ── Drivers ────────────────────────────────────────────────────
  INSERT INTO "Driver" (id, name, phone, city, "vehicleType", "vehiclePlate", capacity, "areaId", "providerId", notes, status, "createdAt", "updatedAt") VALUES
    ('drv_ita_antonio',
     'Antonio Ferrari', '+393301234567', 'ميلان',        'مرسيدس V-Class', 'MI 485 KX', 7, v_milan, v_miTrp,
     'سائق VIP ميلان — يتحدث العربية والإنجليزية، خبرة ١٢ سنة', 'ACTIVE', NOW(), NOW()),
    ('drv_ita_giuseppe',
     'Giuseppe Ricci',  '+393387654321', 'ميلان / كومو', 'BMW 7 Series',   'MI 221 GT', 4, v_milan, NULL,
     'يغطي ميلان وبحيرة كومو — سائق مطار ومرشد غير رسمي',        'ACTIVE', NOW(), NOW()),
    ('drv_ita_roberto',
     'Roberto Marino',  '+393456789012', 'فيرونا',       'فان فيات دوكاتو','VR 339 LM', 8, v_veron, NULL,
     'يغطي فيرونا وبحيرة غاردا — مثالي لمجموعات صغيرة',          'ACTIVE', NOW(), NOW());

END $$;
