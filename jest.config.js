module.exports = {
    testEnvironment: 'node',

    clearMocks: true,
    restoreMocks: true,

    collectCoverage: true,

    coverageDirectory: 'coverage',

    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middlewares/**/*.js',
        'utils/**/*.js'
    ],

    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/models/',
        '/config/',
        '/database/'
    ],

    coverageReporters: [
        'text',
        'lcov',
        'html'
    ]
};