ifndef NAME
$(error NAME is not set)
endif

show: run
	code $(NAME).cpp
	code $(NAME)-results.log
	

run: build
	/home/workspace/$(NAME) > $(NAME)-results.log
	-@rm -f $(NAME)

build: clean $(NAME).cpp
	intel-quantum-compiler -P json $(NAME).cpp

$(NAME).cpp:
	-@test -f $(NAME).cpp && touch $(NAME).cpp
	test -f $(NAME).cpp || cp quantum-examples/$(NAME).cpp $(NAME).cpp


clean:
	-@rm -rf  *.ll *.qs Visualization *log
