insert into public.shops (
  name,
  slug,
  country,
  city,
  address,
  latitude,
  longitude,
  instagram_url,
  website_url,
  status,
  format,
  created_source,
  verification_confidence,
  last_verified_at
)
values
  (
    'Harbor Bubble Waffle',
    'harbor-bubble-waffle-san-francisco-united-states',
    'United States',
    'San Francisco',
    '123 Market Street',
    37.7936,
    -122.3958,
    'https://instagram.com/harborbubblewaffle',
    'https://harborbubblewaffle.example.com',
    'active',
    'cafe',
    'manual',
    0.92,
    timezone('utc', now())
  ),
  (
    'Night Cart Waffles',
    'night-cart-waffles-london-united-kingdom',
    'United Kingdom',
    'London',
    '7 Southbank Walk',
    51.5074,
    -0.1278,
    null,
    null,
    'unknown',
    'truck',
    'agent',
    0.41,
    null
  )
on conflict (slug) do nothing;
