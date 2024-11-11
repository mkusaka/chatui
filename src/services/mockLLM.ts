import { Message } from '../types';

const mockResponses = [
  "なるほど、興味深い視点ですね。もう少し詳しく教えていただけますか？",
  "確かにその通りです。以下のような対応が考えられます：\n\n1. まず問題を整理する\n2. 解決策を検討する\n3. 実行計画を立てる",
  "```typescript\n// こんな実装はいかがでしょうか？\nconst solution = (input: string) => {\n  return input.split('').reverse().join('');\n};\n```",
  "それは素晴らしいアイデアですね。\n\n特に以下の点が優れていると思います：\n- シンプルで分かりやすい\n- 拡張性が高い\n- メンテナンスが容易",
  "申し訳ありません。その点については私の知識が不足しているかもしれません。別の観点から考えてみましょう。",
  "実際の例を見てみましょう：\n\n> 例1: 基本的なケース\n> 例2: エッジケース\n> 例3: 特殊なケース\n\nこのように分類すると理解しやすいかもしれません。",
  "# 重要なポイント\n\n* 最初に全体像を把握する\n* 詳細に入る前に基本を固める\n* 段階的に改善を重ねる\n\nこのアプローチが効果的だと考えます。",
  "面白い質問ですね。これについては様々な見方があります：\n\n- 技術的な側面\n- ビジネス的な側面\n- ユーザー体験の側面\n\nそれぞれの観点から検討する必要があります。",
];

export class MockLLMService {
  async generateResponse(messages: Message[]): Promise<string> {
    // 1秒の遅延を入れる
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ランダムにレスポンスを選択
    const randomIndex = Math.floor(Math.random() * mockResponses.length);
    const baseResponse = mockResponses[randomIndex];

    // 最後のメッセージの内容に基づいて、より文脈に沿った応答を生成
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.includes('?') || lastMessage.content.includes('？')) {
      return `${baseResponse}\n\nご質問ありがとうございます。さらに具体的な情報があれば、より詳しくお答えできます。`;
    }

    if (lastMessage.content.includes('```')) {
      return `${baseResponse}\n\nコードについて補足説明させていただきます。実装の詳細や改善点についてもディスカッションできればと思います。`;
    }

    if (lastMessage.content.length > 100) {
      return `${baseResponse}\n\n詳細な情報をご共有いただき、ありがとうございます。これを踏まえて、さらに議論を深めていければと思います。`;
    }

    return baseResponse;
  }
}
