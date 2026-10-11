import json,yaml,re
def indent_of(l): return len(l)-len(l.lstrip(' '))
def block_end(L,start,ind):
    # last line index of block starting at `start` whose key indent is `ind`
    end=start
    for i in range(start+1,len(L)):
        if L[i].strip()=='' : continue
        if indent_of(L[i])<=ind: break
        end=i
    return end
def ensure(L,path,value,step):
    lo,hi,level=0,len(L)-1,0
    parts=path.split('.')
    for n,part in enumerate(parts):
        ind=level*step
        pat=re.compile(r'^%s%s:(\s|$)'%(' '*ind,re.escape(part)))
        found=None
        for i in range(lo,hi+1):
            if pat.match(L[i]) and indent_of(L[i])==ind: found=i; break
        if found is None:
            new=[]
            for m,p in enumerate(parts[n:]):
                pre=' '*((level+m)*step)
                new.append(pre+p+(': '+json.dumps(value,ensure_ascii=False) if m==len(parts)-n-1 else ':'))
            at=(hi+1) if n>0 else len(L)
            if n==0:
                while at>0 and L[at-1].strip()=='': at-=1
            L[at:at]=new
            return True
        if n==len(parts)-1: return False  # already exists
        lo=found+1; hi=block_end(L,found,ind); level+=1
    return False
