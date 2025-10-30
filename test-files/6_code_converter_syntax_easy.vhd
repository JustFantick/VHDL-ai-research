library IEEE;
use IEEE.std_logic_1164.all;

entity test is
	 port(
		 x : in STD_LOGIC_VECTOR(3 downto 0);
		 y : out STD_LOGIC_VECTOR(3 downto 0)
	     );
end test;

--}} End of automatically maintained section

architecture test of test is
begin
	y(3)<= ( x(3)and not(x(2)) ) or ( x(2)and x(0) ) or ( x(2)and x(1) );
	y(2)<= ( x(3)and not(x(2)) ) or ( x(2)and not(x(0)) ) or ( x(2)and x(1) );
	y(1)<= ( x(3) ) or ( not(x(2))and x(1) ) or ( x(2)and not(x(1))and x(0) );
	y(0)<= (x(0));
end test;
