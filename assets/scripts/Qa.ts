const { ccclass, property } = cc._decorator;

@ccclass
export default class Qa extends cc.Component {

    @property(cc.Node)
    questionNode: cc.Node = null;
    @property(cc.Node)
    btnAnswerNode_1: cc.Node = null;
    @property(cc.Node)
    btnAnswerNode_2: cc.Node = null;
    @property(cc.Node)
    btnAnswerNode_3: cc.Node = null;
    @property(cc.Node)
    btnAnswerNode_4: cc.Node = null;

    @property(cc.Node)
    game: cc.Node = null;

    @property(cc.AudioClip)
    faildAudio: cc.AudioClip = null;

    @property(cc.AudioClip)
    successAudio: cc.AudioClip = null;

    btnAnswerNodeArray: Array<cc.Node> = new Array<cc.Node>();

    currentNode: cc.Node = null;

    right: number; // 正确答案的id
    answer: number; // 选择的id
    isAnswer: boolean; // 是否已经回答了

    onLoad(): void {
        this.btnAnswerNodeArray = [
            this.btnAnswerNode_1,
            this.btnAnswerNode_2,
            this.btnAnswerNode_3,
            this.btnAnswerNode_4,
        ]
    }

    answerClick(event, option): void {
        if (!this.isAnswer) {
            this.isAnswer = true;
            this.currentNode = this.btnAnswerNodeArray[option];
            // judge
            this.answer = Number(option);
            if (this.right === Number(option)) {
                this.correct();
                return;
            }
            this.wrong();
        }
    }

    initQa(question): void {
        // init status
        this.isAnswer = false;
        // init q & a
        this.questionNode.getComponent(cc.Label).string = question.title;
        const [A, B, C, D] = question.answer;
        this.getChildrenLabel(this.btnAnswerNode_1).string = `A.${A.txt}`;
        this.getChildrenLabel(this.btnAnswerNode_2).string = `B.${B.txt}`;
        this.getChildrenLabel(this.btnAnswerNode_3).string = `C.${C.txt}`;
        this.getChildrenLabel(this.btnAnswerNode_4).string = `D.${D.txt}`;
        // init right
        this.right = question.answer.findIndex(item => item.id === question.right);
    }

    correct(): void {
        // this.currentNode
        cc.audioEngine.play(this.successAudio as any, false, 1);
        const seqAction = cc.sequence(cc.scaleTo(.2, 1.1), cc.callFunc(this.animOver, this));
        this.currentNode.runAction(seqAction);
        this.currentNode.color = new cc.Color(88, 165, 92);
    }

    wrong(): void {
        cc.audioEngine.play(this.faildAudio as any, false, 1);
        const seqAction = cc.sequence(cc.scaleTo(.2, 1.1), cc.callFunc(this.animOver, this));
        this.currentNode.runAction(seqAction);
        this.currentNode.color = new cc.Color(217, 80, 84);
    }

    animOver(): void {
        this.game.getComponent('Game').stopSchedule();
        this.scheduleOnce(() => {
            this.currentNode.runAction(cc.scaleTo(.2, 1));
            this.currentNode.color = cc.Color.WHITE;
            this.game.getComponent('Game').endRound();
        }, 1)
    }

    getChildrenLabel(node: cc.Node): cc.Label {
        return node.getChildByName('Label').getComponent(cc.Label);
    }

}
