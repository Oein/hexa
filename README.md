# Hexa

<p align="center">
  <img style="width: 10rem;" src="https://github.com/Oein/hexa/blob/main/public/images/hexaLogo.png?raw=true">
  <p align="center">
    Use components in html!
  </p>
</p>

# Getting started

```bash
# Clone this repo
git clone https://github.com/Oein/hexa.git
cd hexa

# install node_modules. You can use any of package managers you prefer, like npm or pnpm.
yarn install
```

```bash
# Start dev server
yarn dev
```

# How to use components?

First,create an component html file.

```html
<!-- public/components/hello.html -->
<div>Hello from Component!</div>
```

Then, you must define asset path in `src/assets.hexa.ts`.

```ts
const assets: { [key: string]: string } = {
  awesomeID: "/components/hello.html", // path to your component.html
};
```

Second, use `<component>` tag to use it.

```html
<component x-asset-id="awesomeID"></component>
```

# Component Tag's attribute

| Attribute name  |              What it does              |   Example Data   |
| :-------------: | :------------------------------------: | :--------------: |
|   x-asset-id    |     Asset id defined in assetHexa      |    awesomeID     |
| x-asset-loading | (Read only) Is component html fetching |       true       |
|      x-id       | Used to get what prop element is mine  |      123abc      |
|     x-props     |           The props in react           | {"test":"data"}  |
|  x-const-props  |             HTML replacer              | {"const":"data"} |

## x-props

If you change x-props, hexa will change values in props element. Observed with MutationObserver's attribute.

```html
<component x-id="1" x-asset-id="1" x-props='{"test":"data"}'>
  <props path="test">
    <!-- On render, this place will be filled with "data"-->
  </props>
</component>
```

## x-const-props

It changes inital HTML.

For example, if the data is like below, and you want to get "cat" from const props, your const prop string will be `__props_world_creatures_best__`.

```json
{
  "world": {
    "creatures": {
      "best": "cat"
    },
    "hummanCount": 130
  }
}
```

### Asset1

```html
<p style="color: __props_color__;">Colored text</p>
<script>
  console.log("Rendered color is __props_color__");
</script>
```

### index.html

```html
<component x-asset-id="1" x-const-props='{"color":"red"}'></component>
```

### Rendered

```html
<component x-asset-id="1" x-const-props='{"color":"red"}'>
  <p style="color: red;">Colored text</p>
  <script>
    console.log("Rendered color is red");
  </script>
</component>
```

## Import tag

If you want to add css to your component. Use import tag. This will not be rendered on DOM. But it is going to appened to `<head />` like `<link href="/styles/a.css" />`. Loaded href will be ignored.

### Component.html

```html
<import href="/styles/a.css"></import>
<import href="/styles/a.css"></import>
<import href="/styles/a.css"></import>
<import href="/styles/a.css"></import>
<p>Hello world!</p>
```

### Rendered

```html
<head>
    <!-- Import tag is here! -->
    <link href="/styles/a.css"></link>
</head>
<body>
    <component>
        <!-- No import tag here! -->
        <p>Hello world!</p>
    </component>
</body>
```
