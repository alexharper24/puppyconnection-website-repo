#!/bin/sh
u="$1"; s=$(basename "$u")
curl -s --max-time 30 "$u" -H "User-Agent: Mozilla/5.0" -o "raw/$s.html" || exit 0
python harvest.py "raw/$s.html" "$s" "out/$s.json" 2>/dev/null
rm -f "raw/$s.html"
