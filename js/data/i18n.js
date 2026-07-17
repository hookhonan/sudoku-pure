const texts = {
    zh: {
        title: '数独',
        easy: '简单',
        medium: '中等',
        hard: '困难',
        expert: '专家',
        newGame: '新游戏',
        pause: '暂停',
        resume: '继续',
        restart: '重新开始',
        settings: '设置',
        undo: '撤销',
        note: '笔记',
        erase: '擦除',
        hint: '提示',
        mute: '静音',
        theme: '主题',
        light: '浅色',
        dark: '深色',
        victory: '恭喜通关！',
        time: '用时',
        newBest: '新纪录！',
        playAgain: '再来一局',
        changeDifficulty: '更换难度',
        confirmRestart: '确定要重新开始吗？当前进度将丢失。',
        confirmNew: '确定要开始新游戏吗？当前进度将丢失。',
        hintUsed: '提示已使用',
        hintRemaining: '剩余提示',
        hintNoneLeft: '今日提示已用完',
        noHints: '提示次数不足',
        selectDifficulty: '选择难度',
        cancel: '取消',
        confirm: '确定',
        stats: '统计',
        totalGames: '总局数',
        totalWins: '胜利',
        winRate: '胜率',
        bestTime: '最佳用时',
        avgTime: '平均用时',
        streak: '连胜',
        bestStreak: '最长连胜',
    },
    en: {
        title: 'Sudoku',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        expert: 'Expert',
        newGame: 'New Game',
        pause: 'Pause',
        resume: 'Resume',
        restart: 'Restart',
        settings: 'Settings',
        undo: 'Undo',
        note: 'Notes',
        erase: 'Erase',
        hint: 'Hint',
        mute: 'Mute',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        victory: 'Congratulations!',
        time: 'Time',
        newBest: 'New Record!',
        playAgain: 'Play Again',
        changeDifficulty: 'Change Difficulty',
        confirmRestart: 'Restart this game? Progress will be lost.',
        confirmNew: 'Start a new game? Progress will be lost.',
        hintUsed: 'Hint used',
        hintRemaining: 'Hints remaining',
        hintNoneLeft: 'No hints left today',
        noHints: 'Not enough hints',
        selectDifficulty: 'Select Difficulty',
        cancel: 'Cancel',
        confirm: 'OK',
        stats: 'Statistics',
        totalGames: 'Total Games',
        totalWins: 'Wins',
        winRate: 'Win Rate',
        bestTime: 'Best Time',
        avgTime: 'Average Time',
        streak: 'Streak',
        bestStreak: 'Best Streak',
    }
};

let currentLang = 'zh';

export function t(key) {
    return texts[currentLang]?.[key] || texts.zh[key] || key;
}

export function setLang(lang) {
    if (texts[lang]) {
        currentLang = lang;
    }
}

export function getLang() {
    return currentLang;
}
