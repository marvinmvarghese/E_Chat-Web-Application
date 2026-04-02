# ============================================================
#  Makefile — E-Chat KTU Report
#  Requires: XeLaTeX (for Times New Roman via fontspec)
#  Usage:
#    make        — build PDF
#    make clean  — remove aux files
#    make view   — open PDF (macOS)
# ============================================================

MAIN    = main
ENGINE  = xelatex
FLAGS   = -interaction=nonstopmode -halt-on-error

.PHONY: all clean view

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex frontmatter.tex prematter.tex \
             ch1_introduction.tex ch2_literature.tex \
             ch3_methodology.tex ch4_workplan.tex \
             ch5_experimental.tex ch6_results.tex \
             ch7_future.tex backmatter.tex
	$(ENGINE) $(FLAGS) $(MAIN).tex
	$(ENGINE) $(FLAGS) $(MAIN).tex   # second pass for TOC/refs
	$(ENGINE) $(FLAGS) $(MAIN).tex   # third pass for longtable page numbers

clean:
	rm -f *.aux *.log *.toc *.lof *.lot *.out *.synctex.gz \
	      *.fdb_latexmk *.fls *.xdv

view: $(MAIN).pdf
	open $(MAIN).pdf
