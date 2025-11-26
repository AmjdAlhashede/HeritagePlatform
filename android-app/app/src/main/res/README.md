# Android Resources

## Structure

```
res/
├── drawable/           # Vector icons and drawables
├── mipmap-*/          # App launcher icons
├── values/            # Default values (strings, colors, themes)
├── values-ar/         # Arabic translations
├── values-night/      # Dark theme values
└── xml/               # XML configurations
```

## Icons

All icons are Material Design icons in vector format (XML).

### Available Icons:
- `ic_launcher` - App launcher icon
- `ic_video` - Video content icon
- `ic_music` - Audio content icon
- `ic_play` - Play button
- `ic_pause` - Pause button
- `ic_download` - Download icon
- `ic_search` - Search icon
- `ic_person` - User/Performer icon
- `ic_home` - Home icon
- `ic_favorite` - Favorite/Like icon
- `ic_share` - Share icon
- `ic_settings` - Settings icon
- `ic_error` - Error icon
- `ic_check` - Success/Check icon
- `ic_close` - Close icon
- `ic_arrow_back` - Back navigation (RTL aware)

## Colors

Defined in `values/colors.xml`:
- Primary: #1976D2 (Blue)
- Accent: #FF4081 (Pink)
- Background: #F5F5F5 (Light Gray)

## Themes

- Light theme: `values/themes.xml`
- Dark theme: `values-night/themes.xml`

## Dimensions

Standard spacing and sizes in `values/dimens.xml`:
- Spacing: xs(4dp), sm(8dp), md(16dp), lg(24dp), xl(32dp)
- Corner radius: sm(4dp), md(8dp), lg(16dp)
- Icon sizes: sm(16dp), md(24dp), lg(32dp), xl(48dp)

## Localization

- English: `values/strings.xml`
- Arabic: `values-ar/strings.xml`

## Adding New Icons

1. Download Material icon from https://fonts.google.com/icons
2. Save as XML in `drawable/`
3. Use in Compose: `Icon(painter = painterResource(R.drawable.ic_name))`
