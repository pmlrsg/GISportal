#for f in *.css;
#do
#mv  ${f}  "_${f%.*}.scss"
#done


for f in *.scss;
do
echo  "@import \"${f}\";" >> gisportal.scss
done

