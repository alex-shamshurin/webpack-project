module.exports = ({ file, options, env }) => {
  return {
    plugins: [
      // импорт файлов
      require('postcss-import'),
      // нужно указать список разрешенных плагинов
      require('postcss-use')({
        // через url плагин вставка графики в css
        modules: ['postcss-url'],
      }),
      // font-face автоматом
      require('postcss-font-magician'),
      require('postcss-normalize')({
        // В начале страницы принудительно
        forceImport: true,
      }),
      require('postcss-mixins'),
      require('postcss-extend'),
      // Обычные переменные в стиле scss, stylus
      require('postcss-simple-vars')
      // require('postcss-simple-vars')({
      //   variables: () => require('../src/styles/css/css_variables.js'),
      //   unknown: (node, name, result) => {
      //     node.warn(result, `Unknown variable ${name}`)
      //   },
      // }),
      // Ссылки на верхние уровне
      require('postcss-nested-ancestors'),
      // Вложенность селекторов
      require('postcss-nested'),
      // Текущий селектор %@
      require('postcss-current-selector'),
      // Добавить 3D хак перед will-change
      require('postcss-will-change'),
      // Колонки используется calc()
      require('lost'),
      require('postcss-cssnext')({
        features: {
          nesting: false,
          customProperties: false,
        },
      }),
      // Переменные в стиле css --myvar
      require('postcss-css-variables'),
      require('postcss-at-rules-variables'),
      require('postcss-conditionals'),
      require('postcss-stylus-color-functions'),
      require('postcss-short'),
      require('postcss-flexibility'),
      require('postcss-flexbugs-fixes'),
      require('postcss-clearfix'),
      require('css-mqpacker')({ sort: true }),
      require('postcss-emptymediaqueries'),
      require('postcss-media-query-gap'),
      require('postcss-mq-keyframes'),
      require('postcss-sorting'),
    ]
  }
}

