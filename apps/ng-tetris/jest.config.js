module.exports = {
  name: 'ng-tetris',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/ng-tetris',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
