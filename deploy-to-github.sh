#!/usr/bin/env bash
# ==============================================================================
# RT-LAB-LIS: Automatic Deployment to GitHub
# Repository: https://github.com/ramimokhtar228-maker/RT-LAB-LIS
# ==============================================================================

set -e

echo "🔬 معامل رامي مختار - أداة الرفع المباشر إلى GitHub"
echo "---------------------------------------------------------"

REPO_URL="https://github.com/ramimokhtar228-maker/RT-LAB-LIS.git"

if [ -z "$1" ]; then
  echo "⚠️ يرجى إدخال GitHub Personal Access Token (PAT) الخاص بحسابك:"
  echo "مثال للاستخدام: ./deploy-to-github.sh ghp_yourPersonalAccessTokenHere"
  read -p "أو الصق التوكن هنا واضغط Enter: " TOKEN
else
  TOKEN="$1"
fi

if [ -z "$TOKEN" ]; then
  echo "❌ لم يتم إدخال التوكن. تم إلغاء العملية."
  exit 1
fi

echo "📦 تجهيز المشروع والتأكد من إعدادات البناء..."
npm run build

echo "💾 حفظ كافة التعديلات في Git..."
git add -A
git commit -m "update: comprehensive RT laboratory system with 147+ tests, smart reports, and auto-sync" || echo "لا توجد تعديلات جديدة للالتزام بها."

echo "🚀 جاري الرفع إلى المستودع: ramimokhtar228-maker/RT-LAB-LIS..."
AUTHENTICATED_URL="https://ramimokhtar228-maker:${TOKEN}@github.com/ramimokhtar228-maker/RT-LAB-LIS.git"

git branch -M main
git push -f "$AUTHENTICATED_URL" main

echo "---------------------------------------------------------"
echo "✅ تم رفع المشروع بنجاح إلى GitHub!"
echo "🔗 رابط المستودع: https://github.com/ramimokhtar228-maker/RT-LAB-LIS"
echo "🌐 رابط GitHub Pages (سيعمل خلال دقيقة بعد انتهاء GitHub Action):"
echo "   https://ramimokhtar228-maker.github.io/RT-LAB-LIS/"
echo "---------------------------------------------------------"
