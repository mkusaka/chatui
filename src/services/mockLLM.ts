import { Message } from '../types';

const mockResponses = [
  {
    type: 'general',
    responses: [
      "なるほど、興味深い視点ですね。具体的な例を交えて説明していただけますか？",
      "ご指摘の点について、以下のような観点から考えてみましょう：\n\n1. 現状の分析\n2. 課題の特定\n3. 解決策の検討\n4. 実装方針の決定",
      "その考え方は非常に合理的です。特に以下の点が重要だと考えます：\n\n- スケーラビリティ\n- メンテナンス性\n- ユーザビリティ",
      "様々なアプローチが考えられますが、まずは基本的な部分から整理してみましょう。",
    ]
  },
  {
    type: 'code',
    responses: [
      "```typescript\n// 提案させていただいた実装例です\nconst handleInput = (input: string): Result => {\n  return {\n    status: 'success',\n    data: process(input)\n  };\n};\n```\n\n主なポイントは以下の通りです：\n- 型安全性の確保\n- エラーハンドリング\n- 拡張性の考慮",
      "```typescript\ninterface Config {\n  mode: 'development' | 'production';\n  features: string[];\n}\n\nconst setup = (config: Config) => {\n  // 設定に基づいた初期化処理\n};\n```\n\nこのような構造にすることで、設定の管理が容易になります。",
      "コードの改善案として、以下のパターンが考えられます：\n\n```typescript\nclass Service {\n  private state: State;\n\n  async process(data: Input): Promise<Output> {\n    // 処理の実装\n  }\n}\n```",
    ]
  },
  {
    type: 'error',
    responses: [
      "エラーが発生している可能性がある箇所を確認してみましょう。一般的な原因として：\n\n1. 型の不一致\n2. nullチェックの漏れ\n3. 非同期処理の制御\n\nなどが考えられます。",
      "デバッグのために、以下の手順を試してみてはいかがでしょうか：\n\n1. ログ出力の追加\n2. エラーハンドリングの見直し\n3. テストケースの作成",
      "エラーメッセージを見る限り、以下の対応が必要かもしれません：\n\n- 例外処理の追加\n- 型チェックの強化\n- バリデーションの実装",
    ]
  },
  {
    type: 'question',
    responses: [
      "興味深い質問ですね。いくつかの観点から考えてみましょう：\n\n1. 技術的な側面\n2. 運用面での影響\n3. 将来的な拡張性\n\nそれぞれについて詳しく見ていきましょうか？",
      "ご質問ありがとうございます。まず、以下の点を整理させていただきます：\n\n- 現在の状況\n- 達成したい目標\n- 考えられる選択肢\n\nこれらを踏まえて、最適な解決策を検討しましょう。",
      "重要なポイントをご指摘いただきました。補足質問させていただきたいのですが：\n\n1. 具体的なユースケース\n2. パフォーマンス要件\n3. 制約条件\n\nについて、もう少し詳しく教えていただけますか？",
    ]
  }
];

export class MockLLMService {
  async generateResponse(messages: Message[]): Promise<string> {
    // 1秒の遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content.toLowerCase();

    // メッセージの種類を判断
    let responseType = 'general';
    if (content.includes('```') || content.includes('code') || content.includes('実装')) {
      responseType = 'code';
    } else if (content.includes('error') || content.includes('エラー') || content.includes('bug') || content.includes('バグ')) {
      responseType = 'error';
    } else if (content.includes('?') || content.includes('？') || content.includes('どう') || content.includes('でしょう')) {
      responseType = 'question';
    }

    // 該当するタイプのレスポンスを取得
    const responses = mockResponses.find(r => r.type === responseType)?.responses || mockResponses[0].responses;
    const randomIndex = Math.floor(Math.random() * responses.length);

    // コンテキストに基づいて応答を生成
    let response = responses[randomIndex];
    if (messages.length > 1) {
      response += "\n\n前回の会話を踏まえて、さらに詳しく検討していきましょう。";
    }

    return response;
  }
}
