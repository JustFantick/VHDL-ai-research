library ieee;
use ieee.std_logic_1164.all;

entity style_issues_example is
port(
clk:in std_logic;
rst:in std_logic;
data:in std_logic_vector(7 downto 0);
output:out std_logic_vector(7 downto 0)
);
end style_issues_example;

architecture behavioral of style_issues_example is
signal temp:std_logic_vector(7 downto 0);
begin
process(clk,rst)
begin
if rst='1'then
temp<=(others=>'0');
elsif clk'event and clk='1'then
temp<=data;
output<=temp;
end if;
end process;
end behavioral;
