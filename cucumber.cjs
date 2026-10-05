const common = {
  paths: ['features/**/*.feature'],
  require: ['features/support/*.js', 'features/steps/*.js'],
  parallel: 1,
  retry: 0,
};

const profiles = {
  assessment: 'not @broken and not @observed and not @healing',
  ui: '@ui',
  api: '@contract',
  observed: '@observed',
  broken: '@broken',
  healing: '@healing',
};

module.exports = Object.fromEntries(Object.entries(profiles).map(([name, tags]) => [name, {
  ...common,
  tags,
  format: ['progress', `html:reports/${name}.html`, `json:reports/${name}.json`],
}]));
