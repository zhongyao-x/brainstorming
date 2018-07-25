import data from './mock';
const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Node)
    mark: cc.Node = null; // 第 ？题 

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

    @property(cc.Integer)
    questionTotal: number = 0; // 题目数量

    progressBar: cc.ProgressBar = null;
    readyCountdown: cc.Label = null;

    currentTime: number = 0;    // 小题 答题使用时间(s)
    roundSchedule: cc.Scheduler; // 小题 答题计时器

    current: number = 0;  // 当前小题

    inProgress: boolean = false; // 是否在进行中 (小题)

    qdata: Array<any> = null;

    onLoad() {
        this.init();
        var oReq = new XMLHttpRequest();
        oReq.onload = () => {
            const res = JSON.parse(oReq.responseText);
            if (res.status == 0) {
                this.qdata = new Array<any>();
                res.result.list.every((item, i) => {
                    if ((item.answer === 'A' || item.answer === 'B' || item.answer === 'C' || item.answer === 'D') && !item.pic) {
                        // if (item.pic) {
                        let q = {
                            id: i,
                            title: item.question,
                            right: item.answer,
                            pic: item.pic,
                            answer: [
                                {
                                    id: 'A',
                                    txt: item.option1
                                },
                                {
                                    id: 'B',
                                    txt: item.option2
                                },
                                {
                                    id: 'C',
                                    txt: item.option3
                                },
                                {
                                    id: 'D',
                                    txt: item.option4
                                },
                            ]
                        };
                        this.qdata.push(q);
                        if (this.qdata.length >= this.questionTotal) {
                            return false;
                        }
                    }
                    return true;
                });
                console.log(this.qdata);
            }
        };
        // https://jisujiakao.market.alicloudapi.com
        oReq.open('get', 'https://jisujiakao.market.alicloudapi.com/driverexam/query?pagenum=1&pagesize=100&sort=rand&subject=1&type=C1', true);
        oReq.setRequestHeader('Authorization', 'APPCODE d1f7d1f2048841eca46b1a56a941554b');
        console.log(oReq.send());
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
        this.qaNode.opacity = 0;
        // init btnStart
        this.btnStart.active = true;
        // init current
        this.current = 0;
        // init mark
        this.mark.active = false;
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
        if (this.current >= this.qdata.length) {
            // cc.director.loadScene("Result");
            this.init();
            this.unschedule(this.updateCountdownTime);
            // unbind scedule
            return;
        }

        this.mark.active = true;
        this.mark.getComponent(cc.Label).string = `第 ${this.current + 1} 题`
        this.mark.runAction(cc.sequence(cc.scaleTo(.2, 1.2), cc.scaleTo(.2, 1), cc.callFunc(() => {
            this.scheduleOnce(() => {
                this.mark.active = false;
                // realy start
                this.qaNode.runAction(cc.fadeIn(.2));
                this.inProgress = true; // 回合开始
                this.qaNode.getComponent('Qa').initQa(this.qdata[this.current]);
                this.progressBar.progress = 1;
                this.schedule(this.updateCountdownTime, 1);
                this.current += 1;
            }, 1);
        })))
    }

    endRound(): void {
        this.currentTime = 0;
        this.inProgress = false;
        const actionOut = cc.sequence(cc.fadeOut(.2), cc.callFunc(() => {
            this.qaNode.getComponent('Qa').resetStatus();
            this.scheduleOnce(() => {
                this.starRound();
            }, .5)
        }))
        this.qaNode.runAction(actionOut);
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
