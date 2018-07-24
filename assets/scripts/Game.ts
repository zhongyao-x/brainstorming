import qdata from './mock';
const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Node)
    qaNode: cc.Node = null;

    @property(cc.Node)
    progressBarNode: cc.Node = null; // 进度条

    @property(cc.Node)
    readyCountdownNode: cc.Node = null; // ready go 倒计时

    @property(cc.Node)
    btnStart: cc.Node = null; // 开始游戏按钮

    @property(cc.AudioClip)
    countdownAudio_1: cc.AudioClip = null;

    @property(cc.AudioClip)
    countdownAudio_2: cc.AudioClip = null;

    @property(cc.Integer)
    countdownTime: number = 0; // 小题 答题倒计时(s)

    progressBar: cc.ProgressBar = null;
    readyCountdown: cc.Label = null;

    currentTime: number = 0;    // 小题 答题使用时间(s)
    roundSchedule: cc.Scheduler; // 小题 答题计时器

    current: number = 0;  // 当前小题


    onLoad() {
        this.init();
        console.log(qdata);
    }


    init(): void {
        // init progressBar
        this.progressBarNode.active = false;
        this.progressBar = this.progressBarNode.getComponent(cc.ProgressBar);
        this.progressBar.progress = 1;
        // init readyCountdown
        this.readyCountdownNode.active = false;
        this.readyCountdown = this.readyCountdownNode.getComponent(cc.Label);
        // init qa node
        this.qaNode.active = false;
        // init btnStart
        this.btnStart.active = true;
        // init current
        this.current = 0;
    }

    ready(): void {
        let startCountingDown: number = 2;
        // enable readyCountdown
        this.readyCountdownNode.active = true;
        this.readyCountdown.string = 'Ready';
        const action = cc.sequence(cc.scaleTo(.2, 1.6), cc.scaleTo(.6, .8)); // 倒计时 action
        const actionEnd = cc.sequence(cc.scaleTo(.2, 1.6), cc.callFunc(() => { // 倒计时 GO action
            console.log('anim end!');
            setTimeout(() => {
                // 记录初始位置
                const { x, y } = this.readyCountdownNode.position;
                this.readyCountdownNode.runAction(cc.sequence(cc.moveTo(.5, 0, 1000), cc.callFunc(() => {
                    // 复位
                    this.readyCountdownNode.active = false;
                    this.readyCountdownNode.x = x;
                    this.readyCountdownNode.y = y;
                    this.readyCountdownNode.scale = 1;
                    // 激活进度条
                    this.progressBarNode.active = true;
                    // 激活问答
                    this.qaNode.active = true;
                    // 开始游戏
                    this.starRound();
                })));
            }, 300)
        }));
        this.readyCountdownNode.runAction(action);
        this.schedule(() => {
            // console.log(startCountingDown);
            if (startCountingDown <= 0) {
                this.readyCountdown.string = 'Go';
                this.readyCountdownNode.runAction(actionEnd);
                return;
            }
            this.readyCountdown.string = startCountingDown.toString();
            this.readyCountdownNode.runAction(action);
            startCountingDown -= 1;
        }, 1, startCountingDown, 0);
        this.scheduleOnce(() => {
            cc.audioEngine.play(this.countdownAudio_1 as any, false, 1);
        }, 1)
    }

    startGame(): void {
        this.btnStart.active = false;
        this.ready();
    }

    starRound(): void {
        console.log(this.current, qdata.length)
        if (this.current >= qdata.length) {
            this.init();
            // unbind scedule
            this.unschedule(this.updateCountdownTime);
            return;
        }
        this.qaNode.getComponent('Qa').initQa(qdata[this.current]);
        this.progressBar.progress = 1;
        this.schedule(this.updateCountdownTime, 1);
        // console.log(qdata[this.current]);
        this.current += 1;
    }

    endRound(): void {
        this.currentTime = 0;
        this.scheduleOnce(() => {
            this.starRound();
        }, 1);
    }

    stopSchedule(): void {
        this.unschedule(this.updateCountdownTime);
    }

    updateCountdownTime(): void {
        this.currentTime += 1;
        this.progressBar.progress = 1 - this.currentTime / this.countdownTime;
        // console.log(this.currentTime);
        cc.audioEngine.play(this.countdownAudio_2 as any, false, 1);
        if (this.currentTime >= this.countdownTime) {
            this.unschedule(this.updateCountdownTime);
            this.endRound();
        }
    }
}
